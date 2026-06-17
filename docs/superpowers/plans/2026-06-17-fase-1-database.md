# Fase 1 — Database & Multi-tenant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Model the complete database schema (8 tables, 7 enums, relations, indexes), run the initial migration, create a Prisma Client singleton, and seed development data.

**Architecture:** Single Prisma schema at `src/prisma/schema.prisma` with row-level multi-tenancy (every table carries `companyId`). PostgreSQL 16 via Docker Compose. Prisma v7.8.0 with runtime datasource URL (no `url` in schema). Password hashing via bcryptjs for the seed user.

**Tech Stack:** Prisma v7.8.0, PostgreSQL 16, bcryptjs, tsx

**Spec:** `docs/superpowers/specs/2026-06-17-fase-1-database-design.md`

---

## File Map

### Created

| File                 | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `src/lib/prisma.ts`  | Prisma Client singleton (avoids multiple instances in Next.js dev) |
| `src/prisma/seed.ts` | Seed script with test company, owner user, subscription, agent     |

### Modified

| File                       | Change                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| `src/prisma/schema.prisma` | Add 7 enums + 8 models with relations and indexes                  |
| `package.json`             | Add bcryptjs, tsx deps; add prisma.seed config; add db:seed script |

---

### Task 1: Write complete Prisma schema

**Files:**

- Modify: `src/prisma/schema.prisma`

- [ ] **Step 1: Replace `src/prisma/schema.prisma` with the full schema**

Replace the entire file content with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ── Enums ─────────────────────────────────────────

enum UserRole {
  OWNER
  ADMIN
  OPERATOR
}

enum InstanceStatus {
  DISCONNECTED
  CONNECTING
  CONNECTED
}

enum ConversationStatus {
  PENDING
  AI_HANDLING
  HUMAN_HANDLING
  CLOSED
}

enum MessageSender {
  CONTACT
  AI
  OPERATOR
  SYSTEM
}

enum MessageType {
  TEXT
  AUDIO
  IMAGE
  VIDEO
  DOCUMENT
}

enum SubscriptionPlan {
  FREE
  STARTER
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIAL
}

// ── Models ────────────────────────────────────────

model Company {
  id        String    @id @default(uuid())
  name      String
  slug      String    @unique
  email     String
  phone     String?
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  users             User[]
  whatsappInstances WhatsappInstance[]
  agents            Agent[]
  prompts           Prompt[]
  conversations     Conversation[]
  messages          Message[]
  subscription      Subscription?

  @@map("companies")
}

model User {
  id           String    @id @default(uuid())
  companyId    String
  name         String
  email        String    @unique
  passwordHash String
  role         UserRole
  isActive     Boolean   @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  company       Company        @relation(fields: [companyId], references: [id])
  conversations Conversation[]

  @@index([companyId])
  @@map("users")
}

model WhatsappInstance {
  id           String         @id @default(uuid())
  companyId    String
  name         String
  instanceName String
  status       InstanceStatus @default(DISCONNECTED)
  phone        String?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  company       Company        @relation(fields: [companyId], references: [id])
  conversations Conversation[]

  @@unique([companyId, instanceName])
  @@map("whatsapp_instances")
}

model Agent {
  id           String   @id @default(uuid())
  companyId    String
  name         String
  description  String?
  isActive     Boolean  @default(true)
  systemPrompt String   @db.Text
  model        String   @default("gpt-4o-mini")
  temperature  Float    @default(0.7)
  maxTokens    Int      @default(1000)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  company       Company        @relation(fields: [companyId], references: [id])
  prompts       Prompt[]
  conversations Conversation[]

  @@index([companyId])
  @@map("agents")
}

model Prompt {
  id        String   @id @default(uuid())
  companyId String
  agentId   String?
  title     String
  content   String   @db.Text
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  company Company @relation(fields: [companyId], references: [id])
  agent   Agent?  @relation(fields: [agentId], references: [id])

  @@index([companyId])
  @@index([agentId])
  @@map("prompts")
}

model Conversation {
  id                 String             @id @default(uuid())
  companyId          String
  whatsappInstanceId String
  agentId            String?
  operatorId         String?
  contactName        String
  contactPhone       String
  status             ConversationStatus @default(PENDING)
  lastMessageAt      DateTime?
  closedAt           DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  company          Company          @relation(fields: [companyId], references: [id])
  whatsappInstance WhatsappInstance @relation(fields: [whatsappInstanceId], references: [id])
  agent            Agent?           @relation(fields: [agentId], references: [id])
  operator         User?            @relation(fields: [operatorId], references: [id])
  messages         Message[]

  @@index([companyId, contactPhone])
  @@index([status])
  @@index([lastMessageAt])
  @@map("conversations")
}

model Message {
  id                String        @id @default(uuid())
  conversationId    String
  companyId         String
  sender            MessageSender
  type              MessageType   @default(TEXT)
  content           String        @db.Text
  mediaUrl          String?
  whatsappMessageId String?
  isRead            Boolean       @default(false)
  createdAt         DateTime      @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id])
  company      Company      @relation(fields: [companyId], references: [id])

  @@index([conversationId, createdAt])
  @@index([companyId])
  @@map("messages")
}

model Subscription {
  id                  String             @id @default(uuid())
  companyId           String             @unique
  plan                SubscriptionPlan   @default(FREE)
  status              SubscriptionStatus @default(ACTIVE)
  maxInstances        Int                @default(1)
  maxAgents           Int                @default(1)
  maxMessagesPerMonth Int                @default(1000)
  currentPeriodStart  DateTime           @default(now())
  currentPeriodEnd    DateTime
  externalId          String?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  company Company @relation(fields: [companyId], references: [id])

  @@map("subscriptions")
}
```

- [ ] **Step 2: Validate the schema**

Run: `npx prisma validate --schema src/prisma/schema.prisma`

Expected: "The schema at `src/prisma/schema.prisma` is valid."

- [ ] **Step 3: Generate Prisma Client**

Run: `npm run db:generate`

Expected: "Generated Prisma Client (v7.8.0)" with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/prisma/schema.prisma
git commit -m "feat: add complete Prisma schema (8 tables, 7 enums, relations, indexes)"
```

---

### Task 2: Run initial migration

**Files:**

- Creates: `src/prisma/migrations/` directory (auto-generated by Prisma)

- [ ] **Step 1: Ensure Docker Compose is running**

Run: `docker compose ps`

Expected: `ia-whatsapp-postgres` and `ia-whatsapp-redis` both show status running/Up. If not running, start with `docker compose up -d` and wait for healthy status.

- [ ] **Step 2: Run the initial migration**

Run: `npx prisma migrate dev --name init --schema src/prisma/schema.prisma`

Expected: Migration created and applied successfully. Output shows "Your database is now in sync with your schema." All 8 tables + 7 enums created in PostgreSQL.

- [ ] **Step 3: Verify tables exist**

Run: `docker exec ia-whatsapp-postgres psql -U postgres -d ia_whatsapp -c "\dt"`

Expected: Lists all 8 tables: `companies`, `users`, `whatsapp_instances`, `agents`, `prompts`, `conversations`, `messages`, `subscriptions`, plus `_prisma_migrations`.

- [ ] **Step 4: Commit**

```bash
git add src/prisma/migrations/
git commit -m "feat: run initial database migration (8 tables)"
```

---

### Task 3: Create Prisma Client singleton

**Files:**

- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Create `src/lib/prisma.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

This singleton pattern prevents creating multiple PrismaClient instances during Next.js hot reload in development. The `datasourceUrl` is passed explicitly for Prisma v7 compatibility (v7 does not read `url` from the schema file).

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat: add Prisma Client singleton for Next.js"
```

---

### Task 4: Create seed script

**Files:**

- Create: `src/prisma/seed.ts`
- Modify: `package.json` (add deps, seed config, script)

- [ ] **Step 1: Install seed dependencies**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs tsx
```

`bcryptjs`: pure-JS bcrypt for password hashing (also needed in Fase 2 auth).
`tsx`: TypeScript executor for running the seed script.

- [ ] **Step 2: Add seed config to `package.json`**

In the `"prisma"` block, add the `"seed"` field so it becomes:

```json
"prisma": {
  "schema": "src/prisma/schema.prisma",
  "seed": "npx tsx src/prisma/seed.ts"
}
```

Add to `"scripts"`:

```json
"db:seed": "prisma db seed --schema src/prisma/schema.prisma"
```

- [ ] **Step 3: Create `src/prisma/seed.ts`**

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const company = await prisma.company.upsert({
    where: { slug: "empresa-teste" },
    update: {},
    create: {
      name: "Empresa Teste",
      slug: "empresa-teste",
      email: "contato@empresateste.com",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@teste.com" },
    update: {},
    create: {
      companyId: company.id,
      name: "Admin",
      email: "admin@teste.com",
      passwordHash,
      role: "OWNER",
    },
  });

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      plan: "FREE",
      status: "ACTIVE",
      maxInstances: 1,
      maxAgents: 1,
      maxMessagesPerMonth: 1000,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  await prisma.agent.upsert({
    where: {
      id: "00000000-0000-0000-0000-000000000001",
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      companyId: company.id,
      name: "Assistente Geral",
      description: "Agente padrão de atendimento ao cliente",
      systemPrompt:
        "Você é um assistente virtual de atendimento ao cliente. " +
        "Seja educado, objetivo e útil. Responda em português brasileiro. " +
        "Se não souber a resposta, informe que vai encaminhar para um atendente humano.",
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 1000,
    },
  });

  console.log("Seed completed successfully:");
  console.log("  - Company: Empresa Teste");
  console.log("  - User: admin@teste.com (OWNER, password: 123456)");
  console.log("  - Subscription: FREE plan");
  console.log("  - Agent: Assistente Geral");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Uses `upsert` so the seed is idempotent — safe to run multiple times. The agent uses a deterministic UUID so upsert can find it by ID on re-runs.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/prisma/seed.ts
git commit -m "feat: add database seed script (test company, owner, subscription, agent)"
```

---

### Task 5: Run seed and final verification

- [ ] **Step 1: Run the seed**

Run: `npx prisma db seed --schema src/prisma/schema.prisma`

Expected: Output shows "Seed completed successfully" with the 4 seeded entities listed.

- [ ] **Step 2: Verify data in database**

Run: `docker exec ia-whatsapp-postgres psql -U postgres -d ia_whatsapp -c "SELECT name, slug, email FROM companies;"`

Expected: Shows "Empresa Teste | empresa-teste | contato@empresateste.com"

Run: `docker exec ia-whatsapp-postgres psql -U postgres -d ia_whatsapp -c "SELECT name, email, role FROM users;"`

Expected: Shows "Admin | admin@teste.com | OWNER"

Run: `docker exec ia-whatsapp-postgres psql -U postgres -d ia_whatsapp -c "SELECT plan, status FROM subscriptions;"`

Expected: Shows "FREE | ACTIVE"

Run: `docker exec ia-whatsapp-postgres psql -U postgres -d ia_whatsapp -c "SELECT name, model FROM agents;"`

Expected: Shows "Assistente Geral | gpt-4o-mini"

- [ ] **Step 3: Verify Prisma generate still works**

Run: `npm run db:generate`

Expected: "Generated Prisma Client (v7.8.0)" with no errors.

- [ ] **Step 4: Verify build**

Run: `npm run build`

Expected: Build completes with no errors.

- [ ] **Step 5: Run seed again to verify idempotency**

Run: `npx prisma db seed --schema src/prisma/schema.prisma`

Expected: Completes successfully without duplicate key errors (upsert handles re-runs).

---

## Final Verification

After all 5 tasks, confirm the Definition of Done:

- [ ] `npm run db:migrate` — migration applied, all 8 tables exist in PostgreSQL
- [ ] `npm run db:seed` — seed data populated (company, user, subscription, agent)
- [ ] `npm run db:generate` — Prisma Client generated without errors
- [ ] `npm run build` — passes with no errors
- [ ] Data verified via psql queries (4 tables have seed rows)
