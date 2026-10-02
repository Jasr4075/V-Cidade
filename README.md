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

O app usa `supabase-js`, então ele precisa da API do Supabase (PostgREST, Auth e
Storage) — um PostgreSQL "cru" não basta. A forma suportada de rodar localmente
é o Supabase CLI com Docker.

### Requisitos

```bash
sudo apt-get install -y docker.io
sudo usermod -aG docker $USER && sudo systemctl enable --now docker
# encerre e abra a sessão novamente para o grupo docker ter efeito
```

### Subindo o ambiente

```bash
# Sobe Postgres + PostGIS, PostgREST, Auth, Storage e Kong
supabase start

# Aplica migrations e carrega os seeds (categorias + ocorrências de demo)
supabase db reset
```

Serviços opcionais que o app não usa podem ser dispensados para subir mais rápido:

```bash
supabase start -x realtime,imgproxy,studio,edge-runtime,logflare,vector,supavisor,supabase-analytics
```

As chaves são fixas no Supabase local. O `supabase start` imprime a `ANON_KEY`;
no projeto ela já está em `env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key impressa pelo supabase start>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Verifique com `supabase status` e, se quiser, com o Studio em
http://127.0.0.1:3000 (requer remover `studio` da lista `-x`).

### Acessando o banco direto

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Rodando em um celular físico

`localhost` no celular significa **o próprio aparelho**, não o computador. Por isso
`EXPO_PUBLIC_SUPABASE_URL` continua `http://localhost:54321` e o app resolve o host
real em tempo de execução a partir do endereço que o dispositivo usou para falar com
o Metro (`Constants.expoConfig.hostUri`) — em `src/services/supabase.ts`.

Requisitos:

- Celular e computador na **mesma rede Wi-Fi**
- `supabase start` escutando em `0.0.0.0` (padrão; confira com `ss -ltn | grep 54321`)
- Metro acessível pela rede: `npx expo start --tunnel` ou `npx expo start` e leia o
  QR code na rede local

A URL resolvida é logada no console do Metro em desenvolvimento
(`[supabase] usando API em ...`). Se aparecer `localhost` num celular, o host do
Metro não foi identificado — nesse caso, defina `EXPO_PUBLIC_SUPABASE_URL` com o IP
da máquina (por exemplo `http://192.168.17.23:54321`).

Um URL que não seja loopback (Supabase Cloud, um host na rede) é sempre usado
literalmente, sem resolução automática.

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

O `anonymous_id` também viaja no header `x-anonymous-id` de cada requisição
(injetado em `src/services/supabase.ts`). O PostgREST o expõe como o GUC
`request.headers`, que a função `public.current_anonymous_id()` lê para as
policies de RLS decidirem propriedade de uma linha — ver
`supabase/migrations/20240101000200_anonymous_ownership_rls.sql`.

## 🧪 Dados de Demonstração

O seed inclui 10 categorias e 18 ocorrências distribuídas em São Paulo:
- 12 ativas, 2 em melhoria, 4 resolvidas
- Várias categorias

O seed **não** popula apoios, atualizações, fotos nem relacionamentos: a linha do
tempo de cada ocorrência começa vazia e é preenchida pelo uso do app.

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