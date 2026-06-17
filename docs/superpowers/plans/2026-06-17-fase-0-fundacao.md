# Fase 0 — Fundação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the project foundation — folder structure, dependencies, dev environment (Docker), and database scaffolding — so subsequent phases build on a consistent base.

**Architecture:** Migrate the default create-next-app to a `src/` directory layout matching CLAUDE-STACK.md. Install all core libraries, set up Shadcn/UI component system, configure Prettier/ESLint, provision PostgreSQL + Redis via Docker Compose, and scaffold Prisma ORM (no models yet — that's Fase 1).

**Tech Stack:** Next.js 16.2.7, React 19.2.4, TypeScript, Tailwind CSS 4, Shadcn/UI, Prisma, PostgreSQL 16, Redis 7, Docker Compose

**Spec:** `docs/superpowers/specs/2026-06-10-fase-0-fundacao-design.md`

---

## File Map

### Created

| File                               | Purpose                                          |
| ---------------------------------- | ------------------------------------------------ |
| `src/app/page.tsx`                 | Moved from `app/page.tsx`, broken JSX fixed      |
| `src/app/layout.tsx`               | Moved from `app/layout.tsx`                      |
| `src/app/globals.css`              | Moved from `app/globals.css`, extended by Shadcn |
| `src/app/favicon.ico`              | Moved from `app/favicon.ico`                     |
| `src/lib/utils.ts`                 | Shadcn `cn()` helper                             |
| `src/prisma/schema.prisma`         | Prisma datasource scaffold (no models)           |
| `src/components/ui/.gitkeep`       | Shadcn components directory                      |
| `src/components/layout/.gitkeep`   | Layout components                                |
| `src/components/sections/.gitkeep` | Section components                               |
| `src/components/shared/.gitkeep`   | Shared components                                |
| `src/services/.gitkeep`            | API services                                     |
| `src/hooks/.gitkeep`               | Custom React hooks                               |
| `src/store/.gitkeep`               | Zustand stores                                   |
| `src/types/.gitkeep`               | TypeScript types                                 |
| `src/validators/.gitkeep`          | Zod schemas                                      |
| `src/whatsapp/.gitkeep`            | WhatsApp integration logic                       |
| `src/ai/.gitkeep`                  | AI/OpenAI logic                                  |
| `src/actions/.gitkeep`             | Server Actions                                   |
| `src/queues/.gitkeep`              | BullMQ queues                                    |
| `src/utils/.gitkeep`               | Utility functions                                |
| `src/constants/.gitkeep`           | Constants                                        |
| `src/config/.gitkeep`              | Config modules                                   |
| `components.json`                  | Shadcn/UI config (project root)                  |
| `.prettierrc`                      | Prettier config                                  |
| `.prettierignore`                  | Prettier ignore patterns                         |
| `.env.example`                     | Environment variable template (versioned)        |
| `.env`                             | Local env values (gitignored)                    |
| `docker-compose.yml`               | Postgres + Redis for local dev                   |

### Modified

| File                | Change                                 |
| ------------------- | -------------------------------------- |
| `tsconfig.json`     | `paths`: `"./*"` → `"./src/*"`         |
| `eslint.config.mjs` | Add `eslint-config-prettier`           |
| `package.json`      | Dependencies, scripts, prisma config   |
| `.gitignore`        | Add `!.env.example` exception          |
| `README.md`         | Replace boilerplate with project setup |

### Deleted

| File   | Reason              |
| ------ | ------------------- |
| `app/` | Moved to `src/app/` |

---

### Task 1: Migrate to `src/` directory and fix broken page

**Files:**

- Move: `app/` → `src/app/`
- Modify: `tsconfig.json`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `src/` and move `app/` into it**

```bash
mkdir src
git mv app src/app
```

- [ ] **Step 2: Fix `src/app/page.tsx`**

Replace entire file content with:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">IA WhatsApp</h1>
    </main>
  );
}
```

This removes the unused `Image` import and the empty/broken JSX return.

- [ ] **Step 3: Update `tsconfig.json` paths**

Change the `paths` value from:

```json
"@/*": ["./*"]
```

to:

```json
"@/*": ["./src/*"]
```

Leave all other tsconfig settings unchanged.

- [ ] **Step 4: Verify build**

Run: `npm run build`

Expected: Build completes successfully with no errors. Next.js auto-detects `src/app/` since root `app/` no longer exists.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: migrate to src/ directory structure and fix broken page.tsx"
```

---

### Task 2: Create project subdirectory structure

**Files:**

- Create: All `src/` subdirectories with `.gitkeep` placeholders

- [ ] **Step 1: Create all subdirectories**

```bash
mkdir -p src/components/ui src/components/layout src/components/sections src/components/shared
mkdir -p src/services src/hooks src/store src/types src/validators
mkdir -p src/whatsapp src/ai src/actions src/queues src/utils src/constants src/config
mkdir -p src/prisma
```

- [ ] **Step 2: Add `.gitkeep` to empty directories**

```bash
for dir in \
  src/components/ui src/components/layout src/components/sections src/components/shared \
  src/services src/hooks src/store src/types src/validators \
  src/whatsapp src/ai src/actions src/queues src/utils src/constants src/config; do
  touch "$dir/.gitkeep"
done
```

`src/lib/`, `src/prisma/`, and `src/app/` will receive real files in later tasks — no `.gitkeep` needed.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: create src/ subdirectory structure per CLAUDE-STACK.md"
```

---

### Task 3: Set up Prettier and ESLint integration

**Files:**

- Create: `.prettierrc`
- Create: `.prettierignore`
- Modify: `eslint.config.mjs`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Install dev dependencies**

```bash
npm install -D prettier eslint-config-prettier
```

- [ ] **Step 2: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

Matches existing code style (double quotes, semicolons).

- [ ] **Step 3: Create `.prettierignore`**

```
node_modules
.next
out
build
dist
coverage
```

- [ ] **Step 4: Add `eslint-config-prettier` to ESLint config**

Replace `eslint.config.mjs` with:

```mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
```

`eslintConfigPrettier` goes after the other configs so it overrides conflicting formatting rules.

- [ ] **Step 5: Add format scripts to `package.json`**

Add to the `"scripts"` object:

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 6: Verify lint passes**

Run: `npm run lint`

Expected: No errors.

- [ ] **Step 7: Format the codebase**

Run: `npm run format`

Expected: Prettier formats all files. Some files may be changed — that's expected.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: add Prettier config and ESLint integration"
```

---

### Task 4: Install core dependencies

**Files:**

- Modify: `package.json` (dependencies added by npm)
- Modify: `package-lock.json`

- [ ] **Step 1: Install production dependencies**

```bash
npm install zod react-hook-form @hookform/resolvers zustand @tanstack/react-table framer-motion date-fns lucide-react @prisma/client ioredis bullmq
```

- [ ] **Step 2: Install Prisma CLI as dev dependency**

```bash
npm install -D prisma
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build completes successfully. New dependencies don't break anything since no code imports them yet.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install core dependencies (zod, rhf, zustand, prisma, redis, bullmq, etc)"
```

---

### Task 5: Initialize Shadcn/UI

**Files:**

- Create: `components.json` (project root)
- Create: `src/lib/utils.ts`
- Modify: `src/app/globals.css`
- Modify: `package.json` / `package-lock.json` (new sub-dependencies)

- [ ] **Step 1: Run Shadcn init with defaults**

```bash
npx shadcn@latest init -d
```

The `-d` flag uses defaults. The CLI auto-detects Next.js, TypeScript, Tailwind v4 (from `@tailwindcss/postcss`), and `src/` directory (from tsconfig paths).

Expected: Creates `components.json`, `src/lib/utils.ts`, updates `globals.css` with Shadcn CSS variables, installs `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`.

- [ ] **Step 2: Verify created files**

Run: `ls components.json src/lib/utils.ts`

Expected: Both files exist.

Run: `cat src/lib/utils.ts`

Expected: Contains a `cn()` function using `clsx` and `tailwind-merge`.

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build completes successfully.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialize Shadcn/UI with default config"
```

---

### Task 6: Set up environment variables

**Files:**

- Create: `.env.example`
- Create: `.env`
- Modify: `.gitignore`

- [ ] **Step 1: Fix `.gitignore` to allow `.env.example`**

Find this block in `.gitignore`:

```
# env files (can opt-in for committing if needed)
.env*
```

Replace with:

```
# env files
.env*
!.env.example
```

- [ ] **Step 2: Create `.env.example`**

```
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (matches docker-compose.yml dev config)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ia_whatsapp?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth (generate with: openssl rand -base64 32)
JWT_SECRET=
JWT_REFRESH_SECRET=

# OpenAI
OPENAI_API_KEY=

# Evolution API
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
```

- [ ] **Step 3: Create `.env` (local dev copy)**

Same content as `.env.example` but with dev auth values filled:

```
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (matches docker-compose.yml dev config)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ia_whatsapp?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-jwt-refresh-secret-change-in-production

# OpenAI
OPENAI_API_KEY=

# Evolution API
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
```

- [ ] **Step 4: Verify gitignore works**

Run: `git status`

Expected: `.env.example` appears as untracked. `.env` does **NOT** appear.

- [ ] **Step 5: Commit**

```bash
git add .gitignore .env.example
git commit -m "chore: add environment variable setup (.env.example)"
```

---

### Task 7: Set up Docker Compose

**Files:**

- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

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

Credentials match the `DATABASE_URL` in `.env`.

- [ ] **Step 2: Start containers**

Run: `docker compose up -d`

Expected: Both images are pulled (first run) and containers start.

- [ ] **Step 3: Verify containers are running**

Run: `docker compose ps`

Expected: `ia-whatsapp-postgres` and `ia-whatsapp-redis` both show status running/Up.

- [ ] **Step 4: Verify Postgres is accepting connections**

Run: `docker exec ia-whatsapp-postgres pg_isready -U postgres`

Expected: Output contains `accepting connections`.

- [ ] **Step 5: Verify Redis is responding**

Run: `docker exec ia-whatsapp-redis redis-cli ping`

Expected: `PONG`

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml
git commit -m "infra: add Docker Compose for Postgres and Redis dev environment"
```

---

### Task 8: Scaffold Prisma ORM

**Files:**

- Create: `src/prisma/schema.prisma`
- Modify: `package.json` (prisma config block + db scripts)

- [ ] **Step 1: Create `src/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

No models — schema modeling is Fase 1.

- [ ] **Step 2: Add Prisma config to `package.json`**

Add this top-level key to `package.json` (sibling of `"scripts"`, `"dependencies"`, etc.):

```json
"prisma": {
  "schema": "src/prisma/schema.prisma"
}
```

This tells the Prisma CLI where to find the schema since it's not at the default `prisma/schema.prisma` path.

- [ ] **Step 3: Add database scripts to `package.json`**

Add to the `"scripts"` object:

```json
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:studio": "prisma studio",
"db:push": "prisma db push"
```

- [ ] **Step 4: Generate Prisma Client**

Run: `npx prisma generate`

Expected: Output shows `Prisma Client` generated successfully. A warning about no models defined is fine.

- [ ] **Step 5: Validate database connection**

Run: `npx prisma db push`

Expected: Connects to the Postgres container (Task 7 must be running) and succeeds. With no models defined, it just confirms the connection works.

- [ ] **Step 6: Commit**

```bash
git add src/prisma/schema.prisma package.json package-lock.json
git commit -m "chore: scaffold Prisma ORM with PostgreSQL datasource"
```

---

### Task 9: Update README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Replace README content**

Replace entire file with:

````markdown
# IA WhatsApp

Plataforma SaaS de atendimento automatizado via WhatsApp com IA.

## Requisitos

- Node.js 20+
- Docker & Docker Compose
- npm

## Setup

1. Instale as dependências:

   ```bash
   npm install
   ```
````

2. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

   Edite `.env` com suas credenciais (OpenAI, Evolution API, JWT secrets).

3. Suba os serviços de dev (Postgres + Redis):

   ```bash
   docker compose up -d
   ```

4. Gere o Prisma Client:

   ```bash
   npm run db:generate
   ```

5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando               | Descrição                   |
| --------------------- | --------------------------- |
| `npm run dev`         | Servidor de desenvolvimento |
| `npm run build`       | Build de produção           |
| `npm run lint`        | Lint com ESLint             |
| `npm run format`      | Formatar com Prettier       |
| `npm run db:generate` | Gerar Prisma Client         |
| `npm run db:migrate`  | Rodar migrations Prisma     |
| `npm run db:studio`   | Abrir Prisma Studio         |

````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with project setup instructions"
````

---

## Final Verification

After all 9 tasks, run the Definition of Done checklist:

- [ ] `npm run lint` — passes with no errors
- [ ] `npm run format:check` — passes (all files formatted)
- [ ] `npm run build` — completes with no errors
- [ ] `npm run dev` — starts, home page renders at http://localhost:3000
- [ ] `docker compose ps` — postgres and redis containers are running
- [ ] `npx prisma generate` — succeeds
