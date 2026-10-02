-- Production baseline: storage bucket + categories.
--
-- Two gaps showed up when applying the stack to Supabase Cloud:
--
-- 1. The `report-photos` bucket created in 20240101000100 is not visible to the
--    Storage API afterwards (`GET /storage/v1/bucket/report-photos` returned
--    404 NoSuchBucket and the bucket list came back empty). Recreating it
--    idempotently here makes the bucket self-healing: safe to re-run, and it
--    repairs environments where the earlier INSERT was lost.
--
-- 2. `categories` was empty, which makes the app unusable: the category picker
--    reads from this table (src/services/reports/reports.ts), and
--    `reports.category_id` references it. These are reference data, not demo
--    fixtures, so they belong in a migration rather than in the seed files —
--    `supabase db reset` clears seeds, and a fresh production deploy must not
--    depend on them.

INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO categories (id, name, slug, icon, label, active, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Buraco', 'buraco', '🕳️', 'Buraco', true, NOW()),
('22222222-2222-2222-2222-222222222222', 'Iluminação', 'iluminacao', '💡', 'Iluminação', true, NOW()),
('33333333-3333-3333-3333-333333333333', 'Alagamento', 'alagamento', '🌧️', 'Alagamento', true, NOW()),
('44444444-4444-4444-4444-444444444444', 'Calçada', 'calcada', '🚶', 'Calçada', true, NOW()),
('55555555-5555-5555-5555-555555555555', 'Lixo', 'lixo', '🗑️', 'Lixo', true, NOW()),
('66666666-6666-6666-6666-666666666666', 'Trânsito', 'transito', '🚦', 'Trânsito', true, NOW()),
('77777777-7777-7777-7777-777777777777', 'Árvore', 'arvore', '🌳', 'Árvore', true, NOW()),
('88888888-8888-8888-8888-888888888888', 'Acessibilidade', 'acessibilidade', '♿', 'Acessibilidade', true, NOW()),
('99999999-9999-9999-9999-999999999999', 'Obra', 'obra', '🏗️', 'Obra', true, NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Outro', 'outro', '📍', 'Outro', true, NOW())
ON CONFLICT (slug) DO NOTHING;