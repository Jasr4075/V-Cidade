-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    label TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IMPROVING', 'RESOLVED', 'ARCHIVED')),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    anonymous_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report updates table
CREATE TABLE report_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('SAME', 'WORSE', 'BETTER', 'RESOLVED')),
    description TEXT NOT NULL,
    anonymous_id UUID NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    update_id UUID REFERENCES report_updates(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    moderation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supports table
CREATE TABLE supports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    anonymous_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(report_id, anonymous_id)
);

-- Report relations table
CREATE TABLE report_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    related_report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('DUPLICATE', 'RELATED', 'CONTINUATION')),
    created_by_anonymous_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (report_id != related_report_id)
);

-- Resolution confirmations table
CREATE TABLE resolution_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    anonymous_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(report_id, anonymous_id)
);

-- Indexes
CREATE INDEX idx_reports_location ON reports USING GIST (location);
CREATE INDEX idx_reports_category ON reports (category_id);
CREATE INDEX idx_reports_status ON reports (status);
CREATE INDEX idx_reports_anonymous ON reports (anonymous_id);
CREATE INDEX idx_report_updates_report ON report_updates (report_id);
CREATE INDEX idx_photos_report ON photos (report_id);
CREATE INDEX idx_supports_report ON supports (report_id);
CREATE INDEX idx_report_relations_report ON report_relations (report_id);
CREATE INDEX idx_resolution_confirmations_report ON resolution_confirmations (report_id);

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_confirmations ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (active = true);

-- Reports: public read for active/improving/resolved
CREATE POLICY "Reports are viewable by everyone" ON reports FOR SELECT USING (status IN ('ACTIVE', 'IMPROVING', 'RESOLVED'));

-- Reports: insert by anyone
CREATE POLICY "Anyone can create reports" ON reports FOR INSERT WITH CHECK (true);

-- Reports: update by owner or when status changes to RESOLVED via confirmation
CREATE POLICY "Owners can update their reports" ON reports FOR UPDATE USING (anonymous_id = current_setting('app.current_anonymous_id', true)::UUID);

-- Report updates: public read
CREATE POLICY "Report updates are viewable by everyone" ON report_updates FOR SELECT USING (true);

-- Report updates: insert by anyone
CREATE POLICY "Anyone can create report updates" ON report_updates FOR INSERT WITH CHECK (true);

-- Photos: public read for approved
CREATE POLICY "Approved photos are viewable by everyone" ON photos FOR SELECT USING (moderation_status = 'APPROVED');

-- Photos: insert by anyone
CREATE POLICY "Anyone can upload photos" ON photos FOR INSERT WITH CHECK (true);

-- Supports: public read
CREATE POLICY "Supports are viewable by everyone" ON supports FOR SELECT USING (true);

-- Supports: insert by anyone (unique constraint prevents duplicates)
CREATE POLICY "Anyone can support reports" ON supports FOR INSERT WITH CHECK (true);

-- Supports: delete by owner
CREATE POLICY "Owners can remove their support" ON supports FOR DELETE USING (anonymous_id = current_setting('app.current_anonymous_id', true)::UUID);

-- Report relations: public read for approved
CREATE POLICY "Approved relations are viewable by everyone" ON report_relations FOR SELECT USING (status = 'APPROVED');

-- Report relations: insert by anyone
CREATE POLICY "Anyone can create relations" ON report_relations FOR INSERT WITH CHECK (true);

-- Resolution confirmations: public read
CREATE POLICY "Confirmations are viewable by everyone" ON resolution_confirmations FOR SELECT USING (true);

-- Resolution confirmations: insert by anyone (unique constraint prevents duplicates)
CREATE POLICY "Anyone can confirm resolution" ON resolution_confirmations FOR INSERT WITH CHECK (true);

-- Function to find nearby reports
CREATE OR REPLACE FUNCTION find_nearby_reports(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_radius_meters INTEGER DEFAULT 2000,
    p_category_id UUID DEFAULT NULL,
    p_statuses TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    category_id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    location GEOGRAPHY(POINT, 4326),
    anonymous_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    category_name TEXT,
    category_icon TEXT,
    category_slug TEXT,
    supports_count BIGINT,
    resolution_confirmations_count BIGINT,
    distance DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
DECLARE
    status_filter TEXT[] := COALESCE(p_statuses, ARRAY['ACTIVE', 'IMPROVING', 'RESOLVED']);
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.category_id,
        r.title,
        r.description,
        r.status,
        r.location,
        r.anonymous_id,
        r.created_at,
        r.updated_at,
        c.name AS category_name,
        c.icon AS category_icon,
        c.slug AS category_slug,
        (SELECT COUNT(*) FROM supports s WHERE s.report_id = r.id) AS supports_count,
        (SELECT COUNT(*) FROM resolution_confirmations rc WHERE rc.report_id = r.id) AS resolution_confirmations_count,
        ST_Distance(r.location, ST_MakePoint(p_longitude, p_latitude)::GEOGRAPHY) AS distance
    FROM reports r
    JOIN categories c ON c.id = r.category_id
    WHERE r.status = ANY(status_filter)
        AND c.active = true
        AND ST_DWithin(r.location, ST_MakePoint(p_longitude, p_latitude)::GEOGRAPHY, p_radius_meters)
        AND (p_category_id IS NULL OR r.category_id = p_category_id)
    ORDER BY distance
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Function to check duplicates
CREATE OR REPLACE FUNCTION check_duplicates(
    p_category_id UUID,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_radius_meters INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    category_id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    location GEOGRAPHY(POINT, 4326),
    anonymous_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    category_name TEXT,
    category_icon TEXT,
    category_slug TEXT,
    supports_count BIGINT,
    resolution_confirmations_count BIGINT,
    distance DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.category_id,
        r.title,
        r.description,
        r.status,
        r.location,
        r.anonymous_id,
        r.created_at,
        r.updated_at,
        c.name AS category_name,
        c.icon AS category_icon,
        c.slug AS category_slug,
        (SELECT COUNT(*) FROM supports s WHERE s.report_id = r.id) AS supports_count,
        (SELECT COUNT(*) FROM resolution_confirmations rc WHERE rc.report_id = r.id) AS resolution_confirmations_count,
        ST_Distance(r.location, ST_MakePoint(p_longitude, p_latitude)::GEOGRAPHY) AS distance
    FROM reports r
    JOIN categories c ON c.id = r.category_id
    WHERE r.category_id = p_category_id
        AND r.status IN ('ACTIVE', 'IMPROVING')
        AND ST_DWithin(r.location, ST_MakePoint(p_longitude, p_latitude)::GEOGRAPHY, p_radius_meters)
    ORDER BY distance
    LIMIT 5;
END;
$$;

-- Function to get report with details
CREATE OR REPLACE FUNCTION get_report_with_details(
    p_report_id UUID,
    p_anonymous_id UUID
)
RETURNS TABLE (
    id UUID,
    category_id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    location GEOGRAPHY(POINT, 4326),
    anonymous_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    category_name TEXT,
    category_icon TEXT,
    category_slug TEXT,
    supports_count BIGINT,
    user_has_supported BOOLEAN,
    resolution_confirmations_count BIGINT,
    user_has_confirmed_resolution BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.category_id,
        r.title,
        r.description,
        r.status,
        r.location,
        r.anonymous_id,
        r.created_at,
        r.updated_at,
        c.name AS category_name,
        c.icon AS category_icon,
        c.slug AS category_slug,
        (SELECT COUNT(*) FROM supports s WHERE s.report_id = r.id) AS supports_count,
        EXISTS(SELECT 1 FROM supports s WHERE s.report_id = r.id AND s.anonymous_id = p_anonymous_id) AS user_has_supported,
        (SELECT COUNT(*) FROM resolution_confirmations rc WHERE rc.report_id = r.id) AS resolution_confirmations_count,
        EXISTS(SELECT 1 FROM resolution_confirmations rc WHERE rc.report_id = r.id AND rc.anonymous_id = p_anonymous_id) AS user_has_confirmed_resolution
    FROM reports r
    JOIN categories c ON c.id = r.category_id
    WHERE r.id = p_report_id;
END;
$$;

-- Function to confirm resolution
CREATE OR REPLACE FUNCTION confirm_resolution(
    p_report_id UUID,
    p_anonymous_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    confirmation_count INTEGER;
    threshold INTEGER := 3;
BEGIN
    -- Insert confirmation if not exists
    INSERT INTO resolution_confirmations (report_id, anonymous_id)
    VALUES (p_report_id, p_anonymous_id)
    ON CONFLICT (report_id, anonymous_id) DO NOTHING;

    -- Count confirmations
    SELECT COUNT(*) INTO confirmation_count
    FROM resolution_confirmations
    WHERE report_id = p_report_id;

    -- Update report status if threshold reached
    IF confirmation_count >= threshold THEN
        UPDATE reports
        SET status = 'RESOLVED', updated_at = NOW()
        WHERE id = p_report_id AND status != 'RESOLVED';
    END IF;

    RETURN confirmation_count >= threshold;
END;
$$;

-- Trigger to update updated_at on reports
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();