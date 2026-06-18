# Fase 6 — IA / RAG Design Spec

## Objetivo

Processar automaticamente mensagens recebidas via WhatsApp com IA (Claude API), gerando respostas baseadas no system prompt do agente e knowledge base (prompts cadastrados). Inclui CRUD completo para gerenciamento de Agentes e Prompts.

---

## Arquitetura

### Abordagem: Sincrona no Webhook

O processamento de IA acontece diretamente no webhook handler apos salvar a mensagem do contato. O servico de IA e isolado em `src/services/ai.ts` para facilitar migracao futura para filas (Fase 7).

```
Mensagem chega (webhook)
  → Salva no banco (ja existe)
  → Verifica se conversa tem agente
    → Sim: processMessageWithAI()
      → Monta system prompt (agent.systemPrompt + prompts ativos)
      → Busca historico (ultimas 20 mensagens)
      → Chama Claude API (streaming)
      → Salva resposta como Message (sender: AI)
      → Envia via Evolution API (sendTextMessage)
    → Nao: verifica defaultAgentId da instancia
      → Se existe: atribui agente a conversa e processa
      → Se nao: conversa fica sem IA (atendimento manual)
```

### Regras de Processamento

- Processa com IA somente se:
  - Conversa tem `agentId` atribuido (ou instancia tem `defaultAgentId`)
  - Conversa NAO tem `operatorId` (humano nao assumiu)
  - Status e `PENDING` ou `IN_PROGRESS`
  - Agente esta `isActive: true`
- Quando operador humano assume (`operatorId` definido), IA para de responder
- Quando conversa e `CLOSED`, nenhum processamento

---

## Schema Changes

### WhatsappInstance — novo campo

```prisma
model WhatsappInstance {
  // ... campos existentes
  defaultAgentId String?
  defaultAgent   Agent?  @relation(fields: [defaultAgentId], references: [id])
}
```

### Agent — alterar default do model

```prisma
model Agent {
  // ... campos existentes
  model String @default("claude-opus-4-8")  // era "gpt-4o-mini"
  
  // nova relacao inversa
  defaultInstances WhatsappInstance[]
}
```

---

## AI Service (`src/services/ai.ts`)

### Dependencia

- `@anthropic-ai/sdk` (Anthropic SDK para TypeScript)

### Funcao Principal

```typescript
async function processMessageWithAI(conversationId: string): Promise<void>
```

1. Busca conversa com `agent` (include prompts ativos)
2. Busca instancia WhatsApp (para `instanceName`)
3. Compoe system prompt:
   - Base: `agent.systemPrompt`
   - Knowledge base: concatena `prompt.content` de todos os prompts ativos do agente + prompts globais da empresa (sem agentId)
4. Busca ultimas 20 mensagens da conversa
5. Mapeia mensagens para formato Claude:
   - `CONTACT` → `user` role
   - `AI` / `OPERATOR` → `assistant` role
   - `SYSTEM` → ignorado
6. Chama `client.messages.create()` com:
   - `model`: do agent config
   - `system`: system prompt composto
   - `messages`: historico mapeado
   - `max_tokens`: do agent config
   - `temperature`: do agent config (apenas se modelo nao e thinking-capable)
7. Salva resposta no banco (sender: `AI`, type: `TEXT`)
8. Envia via `sendTextMessage(instanceName, contactPhone, responseText)`

### Composicao do System Prompt

```
{agent.systemPrompt}

---

Base de Conhecimento:

## {prompt1.title}
{prompt1.content}

## {prompt2.title}
{prompt2.content}
```

### Historico de Conversa

- Maximo 20 mensagens mais recentes
- Mensagens consecutivas do mesmo role sao agrupadas (Claude exige alternancia user/assistant)
- Mensagens SYSTEM sao ignoradas

---

## CRUD — Agentes

### Server Actions (`src/actions/agents.ts`)

| Action | Descricao |
|--------|-----------|
| `getAgents()` | Lista agentes da empresa do usuario |
| `getAgent(id)` | Busca agente por ID |
| `createAgent(data)` | Cria novo agente |
| `updateAgent(id, data)` | Atualiza agente |
| `deleteAgent(id)` | Remove agente (soft: desativa) |
| `toggleAgent(id)` | Ativa/desativa agente |

### Validators (`src/validators/agents.ts`)

```typescript
const agentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(10),
  model: z.string().default("claude-opus-4-8"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(4096).default(1000),
})
```

### UI — Pagina `/dashboard/agentes`

- Server Component com tabela de agentes
- Colunas: Nome, Modelo, Status (badge ativo/inativo), Conversas ativas, Acoes
- Botao "Novo Agente" abre dialog
- Dialog com formulario: nome, descricao, system prompt (textarea grande), modelo (select), temperature (slider/input), max tokens (input)
- Acoes por linha: Editar, Ativar/Desativar, Excluir

### Componentes

| Arquivo | Descricao |
|--------|-----------|
| `src/app/(dashboard)/dashboard/agentes/page.tsx` | Pagina de listagem |
| `src/components/sections/agent-form-dialog.tsx` | Dialog criar/editar |
| `src/components/sections/agent-actions.tsx` | Acoes por agente |

---

## CRUD — Prompts / Knowledge Base

### Server Actions (`src/actions/prompts.ts`)

| Action | Descricao |
|--------|-----------|
| `getPrompts()` | Lista prompts da empresa |
| `createPrompt(data)` | Cria novo prompt |
| `updatePrompt(id, data)` | Atualiza prompt |
| `deletePrompt(id)` | Remove prompt |
| `togglePrompt(id)` | Ativa/desativa prompt |

### Validators (`src/validators/agents.ts`)

```typescript
const promptSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(10),
  agentId: z.string().uuid().optional(),
})
```

### UI — Pagina `/dashboard/prompts`

- Server Component com tabela de prompts
- Colunas: Titulo, Agente vinculado (ou "Global"), Status, Acoes
- Botao "Novo Prompt" abre dialog
- Dialog com formulario: titulo, conteudo (textarea grande), agente (select opcional), ativo
- Acoes por linha: Editar, Ativar/Desativar, Excluir

### Componentes

| Arquivo | Descricao |
|--------|-----------|
| `src/app/(dashboard)/dashboard/prompts/page.tsx` | Pagina de listagem |
| `src/components/sections/prompt-form-dialog.tsx` | Dialog criar/editar |
| `src/components/sections/prompt-actions.tsx` | Acoes por prompt |

---

## Webhook Integration

### Alteracao em `handleMessageUpsert`

Apos salvar a mensagem e atualizar `lastMessageAt`:

```typescript
// Determina agentId
const agentId = conversation.agentId || whatsappInstance.defaultAgentId;

if (agentId && !conversation.operatorId && conversation.status !== "CLOSED") {
  // Atribui agente se ainda nao tem
  if (!conversation.agentId && agentId) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { agentId },
    });
  }
  
  await processMessageWithAI(conversation.id);
}
```

### Busca da instancia expandida

O `findFirst` do WhatsappInstance precisa incluir `defaultAgentId`:

```typescript
const whatsappInstance = await prisma.whatsappInstance.findFirst({
  where: { instanceName },
  select: { id: true, companyId: true, defaultAgentId: true },
});
```

---

## Sidebar Navigation

Adicionar itens ao `app-sidebar.tsx`:

- "Agentes" com icone `Bot` — rota `/dashboard/agentes`
- "Prompts" com icone `FileText` — rota `/dashboard/prompts`

---

## Arquivos a Criar/Modificar

### Novos (10 arquivos)

| Arquivo | Tipo |
|--------|------|
| `src/services/ai.ts` | Service |
| `src/actions/agents.ts` | Server Actions |
| `src/actions/prompts.ts` | Server Actions |
| `src/validators/agents.ts` | Validators |
| `src/app/(dashboard)/dashboard/agentes/page.tsx` | Page |
| `src/components/sections/agent-form-dialog.tsx` | Component |
| `src/components/sections/agent-actions.tsx` | Component |
| `src/app/(dashboard)/dashboard/prompts/page.tsx` | Page |
| `src/components/sections/prompt-form-dialog.tsx` | Component |
| `src/components/sections/prompt-actions.tsx` | Component |

### Modificados (4 arquivos)

| Arquivo | Mudanca |
|--------|---------|
| `src/prisma/schema.prisma` | defaultAgentId no WhatsappInstance, model default no Agent |
| `src/app/api/webhooks/evolution/route.ts` | Integrar processMessageWithAI |
| `src/components/layout/app-sidebar.tsx` | Adicionar links Agentes e Prompts |
| `docs/IMPLEMENTATIONS.md` | Documentar novos arquivos da Fase 6 |
