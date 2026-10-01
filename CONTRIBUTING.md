# Guia de Contribuição

Obrigado por contribuir com o vCidade! 🎉

## 📋 Como Contribuir

### Reportando Bugs
- Use [Issues](https://github.com/Jasr4075/V-Cidade/issues)
- Inclua: passos para reproduzir, comportamento esperado, real, screenshots
- Marque com label `bug`

### Sugerindo Funcionalidades
- Abra Issue com label `enhancement`
- Descreva o problema que resolve e a solução proposta

### Pull Requests
1. Fork e clone
2. Crie branch: `git checkout -b feature/nome` ou `fix/nome`
4. Commit com mensagens claras (conventional commits)
5. Push e abra PR

## 🎨 Padrões de Código

### TypeScript
- Tipagem estrita (`strict: true`)
- Interfaces em `src/types/`
- Evite `any`

### Componentes
- Pequenos, responsabilidade única
- `StyleSheet` (sem bibliotecas UI pesadas)
- Memoização com `React.memo` quando apropriado

### Arquitetura
```
UI (components) → Features (hooks) → Services → Supabase
```
- Não chame Supabase direto em componentes visuais
- Use hooks em `src/hooks/`

### Commits (Conventional Commits)
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

## 🧪 Testes

```bash
# Lint
npx expo lint

# Typecheck
npx tsc --noEmit

# Expo Doctor
npx expo-doctor
```

Execute antes de abrir PR.

## 🏗️ Estrutura de Branches

- `main`: Produção (protegida)
- `develop`: Integração (opcional)
- `feature/*`, `fix/*`, `docs/*`: Trabalho

## 🔒 Segurança

- **Nunca** commite segredos (.env, keys)
- Use `.env.example` como template
- Valide inputs no backend (RLS, constraints)
- Sanitize dados de entrada

## 📱 Testando Localmente

```bash
# Web
npx expo start --web

# Android
npx expo run:android

# Com Supabase local
supabase start
```

## 📦 Adicionando Dependências

```bash
# Sempre use expo install (resolve versões compatíveis)
npx expo install nome-do-pacote
```

## 🗃️ Migrations

```bash
# Nova migration
# Crie arquivo em supabase/migrations/YYYYMMDDHHMMSS_nome.sql

# Aplique
supabase migration up
# ou
supabase db reset
```

## 🎯 Prioridades do MVP

Veja [AGENTS.md](AGENTS.md) — fases 1 a 13.

Não implemente funcionalidades futuras antes de concluir o fluxo principal.

---

Dúvidas? Abra uma Issue ou Discussion!