-- Demo anonymous IDs (fixed for consistent demo data)
-- These are example anonymous IDs for demo purposes
-- In production, these would be generated per user

-- Demo reports around São Paulo city center
INSERT INTO reports (id, category_id, title, description, status, location, anonymous_id, created_at, updated_at) VALUES
-- Active reports
('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Buraco na Av. Paulista', 'Buraco grande na faixa da direita, perigo para motos e carros', 'ACTIVE', ST_MakePoint(-46.6565, -23.5615)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('b1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Buraco na Rua Augusta', 'Buraco profundo próximo ao cruzamento com a Rua da Consolação', 'ACTIVE', ST_MakePoint(-46.6580, -23.5550)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000002', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
('b1111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222222', 'Poste sem luz na Rua Oscar Freire', 'Iluminação pública apagada há 3 dias, rua muito escura à noite', 'ACTIVE', ST_MakePoint(-46.6700, -23.5600)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000003', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('b1111111-1111-1111-1111-111111111114', '33333333-3333-3333-3333-333333333333', 'Alagamento na Rua 25 de Março', 'Rua alagada após chuva forte, comércio prejudicado', 'ACTIVE', ST_MakePoint(-46.6350, -23.5430)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000004', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
('b1111111-1111-1111-1111-111111111115', '44444444-4444-4444-4444-444444444444', 'Calçada quebrada na Av. Brigadeiro Faria Lima', 'Piso irregular e buracos na calçada, risco para pedestres', 'ACTIVE', ST_MakePoint(-46.6850, -23.5800)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000005', NOW() - INTERVAL '1 week', NOW() - INTERVAL '3 days'),
('b1111111-1111-1111-1111-111111111116', '55555555-5555-5555-5555-555555555555', 'Lixo acumulado na Praça da Sé', 'Muita sujeira e lixo espalhado pela praça central', 'ACTIVE', ST_MakePoint(-46.6330, -23.5500)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000006', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('b1111111-1111-1111-1111-111111111117', '66666666-6666-6666-6666-666666666666', 'Sinal de trânsito quebrado no cruzamento Av. Ipiranga x São João', 'Semáforo piscando amarelo, trânsito confuso', 'ACTIVE', ST_MakePoint(-46.6400, -23.5450)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000007', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
('b1111111-1111-1111-1111-111111111118', '77777777-7777-7777-7777-777777777777', 'Árvore caída na Rua Vergueiro', 'Árvore grande caída bloqueando meia pista', 'ACTIVE', ST_MakePoint(-46.6450, -23.5700)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000008', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

-- Improving reports
('b1111111-1111-1111-1111-111111111119', '11111111-1111-1111-1111-111111111111', 'Buraco na Rua Xavier de Toledo', 'Equipe da prefeitura iniciou reparos ontem', 'IMPROVING', ST_MakePoint(-46.6400, -23.5480)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000009', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
('b1111111-1111-1111-1111-111111111120', '22222222-2222-2222-2222-222222222222', 'Lâmpada queimada na Av. Rebouças', 'Técnicos estiveram no local, aguardando peça', 'IMPROVING', ST_MakePoint(-46.6750, -23.5650)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000010', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '3 days'),

-- Resolved reports
('b1111111-1111-1111-1111-111111111121', '33333333-3333-3333-3333-333333333333', 'Alagamento no Viaduto do Chá', 'Drenagem limpa, problema resolvido após obras', 'RESOLVED', ST_MakePoint(-46.6380, -23.5450)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000011', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
('b1111111-1111-1111-1111-111111111122', '44444444-4444-4444-4444-444444444444', 'Rampa de acessibilidade na Estação Sé', 'Nova rampa instalada, acesso universal garantido', 'RESOLVED', ST_MakePoint(-46.6340, -23.5500)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000012', NOW() - INTERVAL '45 days', NOW() - INTERVAL '10 days'),
('b1111111-1111-1111-1111-111111111123', '88888888-8888-8888-8888-888888888888', 'Piso tátil na Av. Paulista', 'Piso tátil instalado em toda extensão da avenida', 'RESOLVED', ST_MakePoint(-46.6560, -23.5620)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000013', NOW() - INTERVAL '60 days', NOW() - INTERVAL '15 days'),
('b1111111-1111-1111-1111-111111111124', '99999999-9999-9999-9999-999999999999', 'Obra finalizada na Rua da Consolação', 'Recapeamento asfáltico concluído', 'RESOLVED', ST_MakePoint(-46.6550, -23.5530)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000014', NOW() - INTERVAL '90 days', NOW() - INTERVAL '20 days'),

-- More active reports
('b1111111-1111-1111-1111-111111111125', '55555555-5555-5555-5555-555555555555', 'Lixo na Rua Direita', 'Acúmulo de lixo doméstico não coletado', 'ACTIVE', ST_MakePoint(-46.6300, -23.5420)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000015', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('b1111111-1111-1111-1111-111111111126', '11111111-1111-1111-1111-111111111111', 'Buraco na Av. São João', 'Buraco na faixa de ônibus, causa lentidão', 'ACTIVE', ST_MakePoint(-46.6350, -23.5430)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000016', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('b1111111-1111-1111-1111-111111111127', '77777777-7777-7777-7777-777777777777', 'Galho de árvore baixo na Rua Líbero Badaró', 'Galho baixo atrapalhando passagem de caminhões', 'ACTIVE', ST_MakePoint(-46.6360, -23.5460)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000017', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('b1111111-1111-1111-1111-111111111128', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Vazamento de água na Rua Boa Vista', 'Água jorrando no meio fio há 2 dias', 'ACTIVE', ST_MakePoint(-46.6320, -23.5440)::GEOGRAPHY, 'd0000000-0000-4000-8000-000000000018', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;