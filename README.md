# vCidade — Mapa da Cidade

Plataforma comunitária para registrar e acompanhar problemas urbanos de forma anônima, simples e open source.

## 🎯 Objetivo

Criar uma aplicação onde qualquer pessoa possa:
- Visualizar problemas urbanos no mapa
- Registrar novos problemas sem cadastro/login
- Escolher rapidamente uma categoria
- Adicionar fotos
- Visualizar problemas próximos
- Apoiar problemas existentes
- Atualizar situações (continua, piorou, melhorou, resolvido)
- Sugerir duplicidades
- Ver histórico de ocorrências
- Confirmar resoluções comunitárias

## 🛠 Stack

- **Frontend**: Expo + React Native + TypeScript + Expo Router
- **Backend**: Supabase (PostgreSQL + PostGIS + Storage)
- **Mapas**: react-native-maps
- **Storage**: Supabase Storage
- **Autenticação**: Anônima (UUID local)

## 📋 Pré-requisitos

- Node.js 18+
- npm ou bun
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`) — para backend local
- PostgreSQL 15+ com PostGIS — para banco externo

## 🚀 Instalação

```bash
# Clone o repositório
git clone git@github.com:Jasr4075/V-Cidade.git
cd V-Cidade

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

## 🗄️ Backend Local (Supabase)

### Opção 1: Supabase Local (Docker)

```bash
# Inicie o Supabase local
supabase start

# Aplique migrations
supabase db reset

# Ou aplique apenas as migrations
supabase migration up
```

### Opção 2: PostgreSQL Externo

Configure no `.env.local`:
```env
DATABASE_URL=postgresql://postgres:era.a@192.168.0.90:5432/cidade_teste_local
```

Execute as migrations manualmente:
```bash
psql $DATABASE_URL -f supabase/migrations/20240101000000_initial_schema.sql
psql $DATABASE_URL -f supabase/seed/categories.sql
psql $DATABASE_URL -f supabase/seed/reports.sql
```

## 📱 Execução

```bash
# Web
npx expo start --web

# Android
npx expo start --android

# iOS (requer macOS)
npx expo start --ios
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Rotas (Expo Router)
│   ├── index.tsx          # Home com mapa e categorias
│   ├── report/
│   │   ├── [id].tsx       # Detalhes do problema
│   │   └── new/           # Fluxo de criação
│   │       ├── index.tsx  # Escolha categoria
│   │       ├── location.tsx
│   │       ├── photo.tsx
│   │       └── description.tsx
├── components/            # Componentes reutilizáveis
├── features/              # Features por domínio
├── hooks/                 # Custom hooks
├── services/              # Serviços (Supabase, Storage, Location)
├── types/                 # TypeScript types
├── constants/             # Constantes e configurações
└── utils/                 # Utilitários
```

## 🗃️ Banco de Dados

### Tabelas Principais

- **categories**: Categorias de problemas (10 pré-definidas)
- **reports**: Ocorrências registradas
- **report_updates**: Atualizações de status
- **photos**: Fotos anexadas
- **supports**: Apoios (likes) anônimos
- **report_relations**: Relacionamentos (duplicado, relacionado, continuação)
- **resolution_confirmations**: Confirmações de resolução

### Funções RPC

- `find_nearby_reports`: Busca problemas próximos (PostGIS)
- `check_duplicates`: Detecta duplicatas próximas
- `get_report_with_details`: Detalhes completos + contadores
- `confirm_resolution`: Confirma resolução com threshold

## 🔐 Anonimato

- Gera `anonymous_id` (UUID) no primeiro acesso
- Persistido localmente (SecureStore)
- Usado para: apoios, atualizações, confirmações, relações
- **Nenhum dado pessoal solicitado**

## 🧪 Dados de Demonstração

O seed inclui ~15 ocorrências distribuídas em São Paulo:
- Ativas, em melhoria, resolvidas
- Várias categorias
- Apoios, atualizações, relacionamentos
- **Marcados como dados de demonstração**

## 📝 Como Criar uma Migration

```bash
# Crie novo arquivo em supabase/migrations/
# Formato: YYYYMMDDHHMMSS_descricao.sql

# Aplique localmente
supabase migration up

# Ou no PostgreSQL externo
psql $DATABASE_URL -f supabase/migrations/nova_migration.sql
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'feat: nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra Pull Request

## 📄 Licença

MIT License — veja [LICENSE](LICENSE)

---

**vCidade** — Feito pela comunidade, para a comunidade 🏙️