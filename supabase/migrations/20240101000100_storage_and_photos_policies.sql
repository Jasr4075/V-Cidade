-- Local development fixes: Storage policies and missing photos policies.
-- The Supabase local stack ships with storage.objects RLS enabled but no
-- policies, so anonymous uploads/deletes are denied out of the box.

-- Public bucket used by the app (src/services/storage/storage.ts)
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anonymous users to upload photos into the report-photos bucket
CREATE POLICY "Anyone can upload report photos"
    ON storage.objects FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'report-photos');

-- Allow reading objects from the public bucket
CREATE POLICY "Report photos are publicly readable"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'report-photos');

-- Allow deleting objects from the report-photos bucket
CREATE POLICY "Anyone can delete report photos"
    ON storage.objects FOR DELETE TO anon, authenticated
    USING (bucket_id = 'report-photos');

-- photos: the app removes the DB row in deletePhoto() (src/services/storage/storage.ts)
CREATE POLICY "Anyone can delete photo records" ON photos
    FOR DELETE USING (true);
