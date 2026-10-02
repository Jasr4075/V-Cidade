-- Fix anonymous-ownership RLS policies.
--
-- The original policies compared against
--   current_setting('app.current_anonymous_id', true)::UUID
-- but nothing in the app ever set that GUC, so those policies could never
-- match: PATCH /reports and DELETE /supports returned HTTP 204/200 while
-- silently affecting 0 rows.
--
-- PostgREST exposes incoming request headers through the request.headers GUC,
-- so the client now sends an `x-anonymous-id` header (see src/services/supabase.ts).

CREATE OR REPLACE FUNCTION public.current_anonymous_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    raw TEXT;
BEGIN
    raw := current_setting('request.headers', true)::jsonb ->> 'x-anonymous-id';

    IF raw IS NULL OR raw = '' THEN
        RETURN NULL;
    END IF;

    RETURN raw::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.current_anonymous_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_anonymous_id() TO anon, authenticated;

-- Owners can update their own reports
DROP POLICY IF EXISTS "Owners can update their reports" ON reports;
CREATE POLICY "Owners can update their reports" ON reports
    FOR UPDATE TO anon, authenticated
    USING (anonymous_id = public.current_anonymous_id())
    WITH CHECK (anonymous_id = public.current_anonymous_id());

-- Owners can remove their own support
DROP POLICY IF EXISTS "Owners can remove their support" ON supports;
CREATE POLICY "Owners can remove their support" ON supports
    FOR DELETE TO anon, authenticated
    USING (anonymous_id = public.current_anonymous_id());

-- Authors can delete their own photo records
DROP POLICY IF EXISTS "Anyone can delete photo records" ON photos;
CREATE POLICY "Authors can delete their photo records" ON photos
    FOR DELETE TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM reports r
            WHERE r.id = photos.report_id
              AND r.anonymous_id = public.current_anonymous_id()
        )
    );
