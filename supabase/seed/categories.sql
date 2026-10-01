-- Insert categories
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