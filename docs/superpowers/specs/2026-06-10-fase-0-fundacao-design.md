# Fase 0 — Fundação

**Data:** 2026-06-10
**Status:** Aprovado para implementação

## Contexto

Este projeto (`ia-whatsapp`) será uma plataforma SaaS de atendimento via WhatsApp com IA, conforme definido em `CLAUDE-STACK.md` (arquitetura/stack) e `CLAUDE.md` (design/UX). O roadmap completo foi dividido em 11 fases (Fase 0 a Fase 10). Este documento cobre apenas a **Fase 0 — Fundação**: preparar a base do projeto (estrutura de pastas, dependências, ambiente de dev, scaffolding de banco de dados) para que as fases seguintes (banco de dados, auth, UI, integrações) possam ser construídas sobre uma base consistente.

O projeto está atualmente zerado (create-next-app padrão, Next.js 16.2.7 + React 19.2.4 + Tailwind 4), sem nenhuma das libs/estrutura definidas no CLAUDE-STACK.md. O arquivo `app/page.tsx` está com JSX vazio/quebrado.

Docker e Docker Compose já estão instalados e disponíveis (confirmado: Docker 29.5.2 / Compose v5.1.4).

## Observação importante para fases futuras

Esta versão do Next.js (16.2.7) **renomeou `middleware.ts` para `proxy.ts`** (export `proxy` em vez de `middleware`), conforme `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. Isso impacta diretamente a Fase 2 (Auth), que dependerá de proteção de rotas. Não é ação da Fase 0, apenas registro para não esquecer.

## Escopo da Fase 0

### 1. Estrutura de pastas (migração para `src/`)

Migrar `app/` (raiz) para `src/app/` e criar a estrutura de pastas combinando CLAUDE-STACK.md (estrutura técnica) e CLAUDE.md (acrescenta `store/` para Zustand):

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/        (componentes shadcn)
│   ├── layout/
│   ├── sections/
│   └── shared/
├── services/
├── lib/
│   └── utils.ts   (helper cn() do shadcn)
├── hooks/
├── store/
├── types/
├── validators/
├── whatsapp/
├── ai/
├── actions/
├── queues/
├── utils/
├── constants/
├── config/
└── prisma/
    └── schema.prisma
```

- `public/`, `package.json`, `next.config.ts`, `tsconfig.json`, `.env*`, `eslint.config.mjs` permanecem na raiz (exigência do Next.js).
- Pastas vazias recebem `.gitkeep` para serem versionadas.
- `tsconfig.json`: alterar `paths` de `"@/*": ["./*"]` para `"@/*": ["./src/*"]`.
- `app/page.tsx` está com retorno JSX vazio e import não utilizado de `Image` — será substituído por um placeholder mínimo válido (a landing/dashboard real vem em fases posteriores).
- `favicon.ico` e `globals.css` movem junto com `app/`.

### 2. Dependências & ferramentas

**Shadcn/UI**: `npx shadcn@latest init`, com tema base neutro. O tema dark + regra 60-30-10 (vermelho como accent), definido no CLAUDE.md, será aplicado na Fase 3 (Design System), em cima da infraestrutura criada aqui (CSS variables, `components.json`, helper `cn()`).

**Bibliotecas de produção** (via npm):

- `zod` — validação
- `react-hook-form` + `@hookform/resolvers` — formulários
- `zustand` — estado global
- `@tanstack/react-table` — tabelas
- `framer-motion` — animações
- `date-fns` — datas
- `lucide-react` — ícones
- `@prisma/client` — ORM (client)
- `ioredis` — cliente Redis
- `bullmq` — filas

**Dependências de dev**:

- `prisma` — CLI
- `prettier` + `eslint-config-prettier` — formatação consistente com ESLint

**Scripts adicionais em `package.json`**:

- `format` / `format:check` (Prettier)
- `db:generate`, `db:migrate`, `db:studio` (Prisma)

### 3. Variáveis de ambiente

Criar `.env.example` na raiz:

```
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ia_whatsapp?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=

# OpenAI
OPENAI_API_KEY=

# Evolution API
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
```

Criar também `.env` (cópia local, com os valores de dev preenchidos para Postgres/Redis do Compose) e garantir que `.env` está no `.gitignore` (mantendo `.env.example` versionado).

### 4. Docker Compose (ambiente de dev)

`docker-compose.yml` na raiz com os serviços `postgres` e `redis` (Evolution API entra na Fase 4):

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: ia-whatsapp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ia_whatsapp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: ia-whatsapp-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Credenciais alinhadas com `.env` (dev local apenas).

### 5. Prisma (scaffolding, sem models)

`src/prisma/schema.prisma` com apenas datasource e generator:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

`package.json` configurado com `"prisma": { "schema": "src/prisma/schema.prisma" }`. A modelagem das tabelas (companies, users, conversations, etc.) é a Fase 1.

### 6. README

Substituir o boilerplate do create-next-app por instruções específicas do projeto: copiar `.env.example` → `.env`, subir `docker compose up -d`, `npm install`, `npx prisma generate`, `npm run dev`.

## Fora do escopo (fases futuras)

- Modelagem do schema Prisma e migrations (Fase 1)
- Autenticação / `proxy.ts` (Fase 2)
- Tema dark + 60-30-10 e shell do dashboard (Fase 3)
- Serviço Evolution API no Compose (Fase 4)
- Workers BullMQ reais (Fase 7)

## Critérios de verificação (Definition of Done)

- `npm install` conclui sem erros
- `npm run lint` passa
- `npm run build` conclui sem erros
- `npm run dev` sobe e a home renderiza sem erro de runtime
- `docker compose up -d` sobe `postgres` e `redis` com healthcheck OK
- `npx prisma generate` executa com sucesso (client gerado a partir do schema vazio)
