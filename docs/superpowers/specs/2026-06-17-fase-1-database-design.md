# Fase 1 — Banco de Dados & Multi-tenant

**Data:** 2026-06-17
**Status:** Aprovado para implementação

## Contexto

Com a Fase 0 concluída (estrutura de pastas, dependências, Docker Compose com Postgres + Redis, Prisma scaffolded), esta fase modela o schema do banco de dados e implementa as migrations + seed. O schema Prisma atual está vazio (apenas generator + datasource, sem models). PostgreSQL 16 está rodando via Docker Compose em localhost:5432.

Prisma v7.8.0 está instalado. O datasource não usa `url` inline no schema (mudança do v7 — URL é fornecida via runtime/.env).

## Decisões Arquiteturais

### Multi-tenancy: Row-level isolation

Todas as tabelas (exceto `companies` e `subscriptions`) possuem `companyId` como foreign key. Queries sempre filtram por empresa. É o padrão mais simples, eficiente e Prisma-friendly para SaaS.

### IDs

UUID v4 em todas as tabelas via `@default(uuid())`.

### Timestamps

`createdAt` (DateTime, @default(now())) e `updatedAt` (DateTime, @updatedAt) em todas as tabelas.

### Soft delete

Apenas em `companies` (via campo `deletedAt` nullable). Razão: dados de billing/legal não podem ser perdidos. Demais entidades usam hard delete — sempre dentro do escopo de uma empresa.

### Enums

Definidos como Prisma enums mapeados no PostgreSQL:

- `UserRole`: OWNER, ADMIN, OPERATOR
- `InstanceStatus`: DISCONNECTED, CONNECTING, CONNECTED
- `ConversationStatus`: PENDING, AI_HANDLING, HUMAN_HANDLING, CLOSED
- `MessageSender`: CONTACT, AI, OPERATOR, SYSTEM
- `MessageType`: TEXT, AUDIO, IMAGE, VIDEO, DOCUMENT
- `SubscriptionPlan`: FREE, STARTER, PRO, ENTERPRISE
- `SubscriptionStatus`: ACTIVE, PAST_DUE, CANCELED, TRIAL

## Schema (8 tabelas)

### companies

Tenant principal do sistema multi-tenant.

| Campo     | Tipo          | Constraints          |
| --------- | ------------- | -------------------- |
| id        | String (UUID) | @id @default(uuid()) |
| name      | String        |                      |
| slug      | String        | @unique              |
| email     | String        |                      |
| phone     | String?       |                      |
| deletedAt | DateTime?     | soft delete          |
| createdAt | DateTime      | @default(now())      |
| updatedAt | DateTime      | @updatedAt           |

Relações: has many users, whatsappInstances, agents, prompts, conversations, messages. Has one subscription.

### users

Usuários da empresa com três níveis de role.

| Campo        | Tipo          | Constraints                  |
| ------------ | ------------- | ---------------------------- |
| id           | String (UUID) | @id @default(uuid())         |
| companyId    | String        | FK → companies               |
| name         | String        |                              |
| email        | String        | @unique                      |
| passwordHash | String        |                              |
| role         | UserRole      | enum: OWNER, ADMIN, OPERATOR |
| isActive     | Boolean       | @default(true)               |
| lastLoginAt  | DateTime?     |                              |
| createdAt    | DateTime      | @default(now())              |
| updatedAt    | DateTime      | @updatedAt                   |

Índices: `email` (unique), `companyId`.

### whatsapp_instances

Instâncias WhatsApp conectadas via Evolution API.

| Campo        | Tipo           | Constraints              |
| ------------ | -------------- | ------------------------ |
| id           | String (UUID)  | @id @default(uuid())     |
| companyId    | String         | FK → companies           |
| name         | String         | display name             |
| instanceName | String         | Evolution API identifier |
| status       | InstanceStatus | @default(DISCONNECTED)   |
| phone        | String?        | preenchido após conexão  |
| createdAt    | DateTime       | @default(now())          |
| updatedAt    | DateTime       | @updatedAt               |

Índices: `companyId` + `instanceName` (unique compound).

### agents

Agentes de IA configuráveis por empresa.

| Campo        | Tipo          | Constraints                 |
| ------------ | ------------- | --------------------------- |
| id           | String (UUID) | @id @default(uuid())        |
| companyId    | String        | FK → companies              |
| name         | String        | ex: "Atendimento", "Vendas" |
| description  | String?       |                             |
| isActive     | Boolean       | @default(true)              |
| systemPrompt | String        | @db.Text                    |
| model        | String        | @default("gpt-4o-mini")     |
| temperature  | Float         | @default(0.7)               |
| maxTokens    | Int           | @default(1000)              |
| createdAt    | DateTime      | @default(now())             |
| updatedAt    | DateTime      | @updatedAt                  |

Índices: `companyId`.

### prompts

Instruções/conhecimento extra — podem ser globais da empresa (agentId null) ou específicos de um agente.

| Campo     | Tipo          | Constraints                 |
| --------- | ------------- | --------------------------- |
| id        | String (UUID) | @id @default(uuid())        |
| companyId | String        | FK → companies              |
| agentId   | String?       | FK → agents (null = global) |
| title     | String        |                             |
| content   | String        | @db.Text                    |
| isActive  | Boolean       | @default(true)              |
| createdAt | DateTime      | @default(now())             |
| updatedAt | DateTime      | @updatedAt                  |

Índices: `companyId`, `agentId`.

### conversations

Conversas WhatsApp com lifecycle de status.

| Campo              | Tipo               | Constraints              |
| ------------------ | ------------------ | ------------------------ |
| id                 | String (UUID)      | @id @default(uuid())     |
| companyId          | String             | FK → companies           |
| whatsappInstanceId | String             | FK → whatsapp_instances  |
| agentId            | String?            | FK → agents              |
| operatorId         | String?            | FK → users               |
| contactName        | String             | nome do contato WhatsApp |
| contactPhone       | String             | telefone do contato      |
| status             | ConversationStatus | @default(PENDING)        |
| lastMessageAt      | DateTime?          |                          |
| closedAt           | DateTime?          |                          |
| createdAt          | DateTime           | @default(now())          |
| updatedAt          | DateTime           | @updatedAt               |

Índices: `companyId` + `contactPhone`, `status`, `lastMessageAt`.

### messages

Mensagens individuais dentro de uma conversa.

| Campo             | Tipo          | Constraints                         |
| ----------------- | ------------- | ----------------------------------- |
| id                | String (UUID) | @id @default(uuid())                |
| conversationId    | String        | FK → conversations                  |
| companyId         | String        | FK → companies (denormalizado)      |
| sender            | MessageSender | enum: CONTACT, AI, OPERATOR, SYSTEM |
| type              | MessageType   | @default(TEXT)                      |
| content           | String        | @db.Text                            |
| mediaUrl          | String?       | para mensagens de mídia             |
| whatsappMessageId | String?       | ID da Evolution API                 |
| isRead            | Boolean       | @default(false)                     |
| createdAt         | DateTime      | @default(now())                     |

Índices: `conversationId` + `createdAt`, `companyId`.

### subscriptions

Assinatura da empresa (relação 1:1 com company).

| Campo               | Tipo               | Constraints                |
| ------------------- | ------------------ | -------------------------- |
| id                  | String (UUID)      | @id @default(uuid())       |
| companyId           | String             | @unique, FK → companies    |
| plan                | SubscriptionPlan   | @default(FREE)             |
| status              | SubscriptionStatus | @default(ACTIVE)           |
| maxInstances        | Int                | @default(1)                |
| maxAgents           | Int                | @default(1)                |
| maxMessagesPerMonth | Int                | @default(1000)             |
| currentPeriodStart  | DateTime           | @default(now())            |
| currentPeriodEnd    | DateTime           |                            |
| externalId          | String?            | ID do gateway de pagamento |
| createdAt           | DateTime           | @default(now())            |
| updatedAt           | DateTime           | @updatedAt                 |

Índices: `companyId` (unique).

## Seed

Dados iniciais para desenvolvimento:

- **Empresa**: "Empresa Teste", slug "empresa-teste"
- **Usuário OWNER**: "Admin", admin@teste.com, senha hash de "123456"
- **Subscription FREE**: limites padrão (1 instância, 1 agente, 1000 msgs/mês)
- **Agente**: "Assistente Geral", com system prompt básico de atendimento

## Escopo da Fase 1

### Inclui

- Schema Prisma completo (8 tabelas + 7 enums + relações + índices)
- Migration inicial (`prisma migrate dev`)
- Seed script (`prisma/seed.ts`)
- Lib helper para Prisma Client singleton (`src/lib/prisma.ts`)

### Não inclui

- API routes / Server Actions (Fase 2+)
- UI (Fase 3+)
- Lógica de negócio (fases posteriores)
- RAG / embeddings table (Fase 6)

## Critérios de verificação

- `npm run db:migrate` cria todas as tabelas no PostgreSQL
- `npx prisma db seed` popula dados iniciais sem erros
- `npm run db:studio` abre o Prisma Studio mostrando todas as 8 tabelas com dados seed
- `npm run db:generate` gera o client sem erros
- `npm run build` passa sem erros
