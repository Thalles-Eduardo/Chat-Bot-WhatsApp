# Fase 4 — Integracao WhatsApp (Evolution API)

**Data:** 2026-06-17
**Status:** Aprovado para implementacao

## Contexto

Fases 0-3 completas: banco de dados com 8 tabelas (incluindo WhatsappInstance com status DISCONNECTED/CONNECTING/CONNECTED, Conversation, Message), autenticacao JWT completa, design system dark com accent vermelho, paginas de login/registro, dashboard shell com sidebar. A tabela Subscription limita `maxInstances` por empresa. Variaveis `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` ja configuradas no `.env` (vazias).

## Decisoes Arquiteturais

### Evolution API como Bridge

A Evolution API e um servico externo que expoe o WhatsApp via REST. Nosso backend se comunica com ela em dois fluxos:

- **Outbound (backend → Evolution):** criar/deletar instancias, obter QR code, enviar mensagens, verificar status
- **Inbound (Evolution → backend):** webhooks POST para mensagens recebidas e mudancas de status de conexao

### Service Layer Centralizado

Um unico arquivo `src/services/evolution.ts` encapsula todas as chamadas HTTP para a Evolution API. Usa `fetch` nativo com headers `apikey` e `Content-Type: application/json`. Todos os metodos recebem `instanceName` como identificador (a Evolution usa nome da instancia, nao UUID).

### Webhook Publico com Autenticacao por API Key

O endpoint `POST /api/webhooks/evolution` e publico (sem JWT) — a Evolution API chama ele externamente. Autenticacao feita comparando o header `apikey` do request com `EVOLUTION_API_KEY` do `.env`. A rota deve ser excluida no `proxy.ts`.

### Server Actions para CRUD

Instancias sao gerenciadas via Server Actions (nao API routes), seguindo o padrao da Fase 2. Cada action verifica autenticacao, role (minimo ADMIN para criar/deletar), e limites da subscription.

## Service Layer — `src/services/evolution.ts`

Funcoes exportadas:

| Funcao | Params | Retorno | Descricao |
|--------|--------|---------|-----------|
| `createInstance` | `instanceName: string, webhookUrl: string` | `{ instance, hash, qrcode? }` | Cria instancia na Evolution e configura webhook |
| `deleteInstance` | `instanceName: string` | `void` | Remove instancia da Evolution |
| `getInstanceStatus` | `instanceName: string` | `{ state: string }` | Retorna estado da conexao (open/close/connecting) |
| `getQRCode` | `instanceName: string` | `{ base64: string, pairingCode?: string }` | Retorna QR code para conexao |
| `sendTextMessage` | `instanceName: string, phone: string, text: string` | `{ key: { id: string } }` | Envia mensagem texto |
| `logoutInstance` | `instanceName: string` | `void` | Desconecta a sessao WhatsApp |

Mapeamento de endpoints da Evolution API:

- `POST /instance/create` — cria instancia com webhook config inline
- `DELETE /instance/delete/{instanceName}` — deleta instancia
- `GET /instance/connectionState/{instanceName}` — status de conexao
- `GET /instance/connect/{instanceName}` — obtem QR code
- `POST /message/sendText/{instanceName}` — envia texto
- `DELETE /instance/logout/{instanceName}` — logout

Cada funcao faz tratamento de erros: se a Evolution retornar status != 2xx, lanca um erro com a mensagem da resposta.

Helper interno `evolutionFetch(path, options)` centraliza base URL, headers, e error handling.

## Server Actions — `src/actions/whatsapp.ts`

### `createInstance(input: unknown)`

1. `requireRole("ADMIN")`
2. Valida input com `createInstanceSchema` (nome obrigatorio, min 2 chars)
3. Gera `instanceName` unico: `{companySlug}-{name-slugified}` (evita colisao entre empresas)
4. Verifica limite: conta instancias da empresa vs `subscription.maxInstances`
5. Chama `evolution.createInstance(instanceName, webhookUrl)`
6. Cria registro `WhatsappInstance` no Prisma com status CONNECTING
7. Retorna `{ success: true, instanceId }`

### `deleteInstance(instanceId: string)`

1. `requireRole("ADMIN")`
2. Busca instancia no Prisma (verifica que pertence a empresa do usuario)
3. Chama `evolution.deleteInstance(instanceName)`
4. Deleta registro no Prisma
5. Retorna `{ success: true }`

### `connectInstance(instanceId: string)`

1. `requireAuth()`
2. Busca instancia (verifica ownership)
3. Chama `evolution.getQRCode(instanceName)`
4. Atualiza status para CONNECTING no Prisma
5. Retorna `{ success: true, qrCode: base64 }`

### `disconnectInstance(instanceId: string)`

1. `requireRole("ADMIN")`
2. Busca instancia (verifica ownership)
3. Chama `evolution.logoutInstance(instanceName)`
4. Atualiza status para DISCONNECTED no Prisma
5. Retorna `{ success: true }`

### `getInstances()`

1. `requireAuth()`
2. Retorna todas as instancias da empresa do usuario

### `getInstanceQRCode(instanceId: string)`

1. `requireAuth()`
2. Busca instancia (verifica ownership)
3. Chama `evolution.getQRCode(instanceName)`
4. Retorna `{ success: true, qrCode: base64 }`

## Webhook — `src/app/api/webhooks/evolution/route.ts`

### Autenticacao

Compara header `apikey` com `process.env.EVOLUTION_API_KEY`. Se invalido, retorna 401.

### Eventos Tratados

#### `messages.upsert` — Mensagem recebida

Payload relevante:
```typescript
{
  event: "messages.upsert",
  instance: string, // instanceName
  data: {
    key: { remoteJid: string, fromMe: boolean, id: string },
    message: { conversation?: string, extendedTextMessage?: { text: string } },
    pushName: string // nome do contato
  }
}
```

Processamento:
1. Ignora mensagens `fromMe: true` (enviadas pelo bot)
2. Extrai `instanceName` do payload
3. Busca `WhatsappInstance` pelo `instanceName`
4. Extrai telefone do `remoteJid` (remove `@s.whatsapp.net`)
5. Busca ou cria `Conversation` pelo par (whatsappInstanceId + contactPhone)
6. Cria `Message` com sender CONTACT, tipo TEXT
7. Atualiza `conversation.lastMessageAt`
8. Retorna 200

Nota: O processamento por IA sera adicionado na Fase 6. Por ora, mensagens sao apenas salvas.

#### `connection.update` — Status de conexao

Payload relevante:
```typescript
{
  event: "connection.update",
  instance: string,
  data: { state: "open" | "close" | "connecting" }
}
```

Processamento:
1. Mapeia estado Evolution → enum Prisma: `open` → CONNECTED, `close` → DISCONNECTED, `connecting` → CONNECTING
2. Atualiza `WhatsappInstance.status`
3. Se `state === "open"`, busca info da instancia na Evolution para obter o numero de telefone e atualiza `WhatsappInstance.phone`
4. Retorna 200

### Proxy Exclusion

Adicionar `/api/webhooks/*` a lista de rotas publicas no `proxy.ts`.

## Validadores — `src/validators/whatsapp.ts`

```typescript
export const createInstanceSchema = z.object({
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
});

export const sendMessageSchema = z.object({
  phone: z.string().min(10, "Telefone invalido"),
  text: z.string().min(1, "Mensagem nao pode ser vazia"),
});
```

## Pagina de Instancias — `src/app/(dashboard)/dashboard/instancias/page.tsx`

### Layout

Server Component que busca instancias via `getInstances()`. Renderiza:

- Titulo "Instancias WhatsApp" + botao "Nova instancia"
- Tabela com colunas: Nome, Telefone, Status, Acoes
- Status como badge colorido: CONNECTED (verde), CONNECTING (amarelo), DISCONNECTED (cinza)
- Acoes: Conectar, Desconectar, Excluir

### Componentes Client

| Componente | Path | Responsabilidade |
|-----------|------|-----------------|
| `CreateInstanceDialog` | `src/components/sections/create-instance-dialog.tsx` | Dialog para criar nova instancia (campo nome + submit) |
| `QRCodeDialog` | `src/components/sections/qr-code-dialog.tsx` | Dialog que exibe QR code base64 para conexao, com polling para verificar se conectou |
| `InstanceActions` | `src/components/sections/instance-actions.tsx` | Botoes de acao por instancia (conectar, desconectar, excluir) com confirmacao |

### Componentes Shadcn Necessarios

Instalar: `dialog`, `table`, `badge`

### Polling de Status

O `QRCodeDialog` faz polling a cada 5 segundos chamando `getInstanceQRCode` para verificar se o telefone ja escaneou o QR. Quando o status muda para CONNECTED (via webhook que atualiza o DB), o dialog fecha automaticamente.

A pagina de instancias usa `router.refresh()` apos acoes para refletir mudancas.

## Estrutura de Arquivos

### Criados

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/services/evolution.ts` | Client HTTP para Evolution API |
| `src/actions/whatsapp.ts` | Server Actions para CRUD de instancias |
| `src/validators/whatsapp.ts` | Schemas Zod para validacao |
| `src/app/api/webhooks/evolution/route.ts` | Webhook handler para eventos da Evolution |
| `src/app/(dashboard)/dashboard/instancias/page.tsx` | Pagina de instancias |
| `src/components/sections/create-instance-dialog.tsx` | Dialog para criar instancia |
| `src/components/sections/qr-code-dialog.tsx` | Dialog com QR code + polling |
| `src/components/sections/instance-actions.tsx` | Botoes de acao por instancia |

### Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/proxy.ts` | Adicionar `/api/webhooks/*` como rota publica |

### Auto-gerados (Shadcn)

| Arquivo | Source |
|---------|--------|
| `src/components/ui/dialog.tsx` | `npx shadcn add dialog` |
| `src/components/ui/table.tsx` | `npx shadcn add table` |
| `src/components/ui/badge.tsx` | `npx shadcn add badge` |

## Escopo

### Inclui

- Service layer para Evolution API (6 funcoes)
- Server Actions para CRUD de instancias (6 actions)
- Webhook handler para mensagens recebidas e status de conexao
- Validacao de limites da subscription (maxInstances)
- Pagina de instancias com tabela, badges de status, dialogs
- QR code display com polling
- Exclusao de `/api/webhooks/*` no proxy.ts

### Nao inclui

- Processamento IA de mensagens (Fase 6)
- Pagina de conversas / inbox (Fase 5)
- Envio de midia (imagens, audio, documentos)
- Filas Redis para processamento async (Fase 7)
- Rate limiting (Fase 7)
- Notificacoes real-time via WebSocket/SSE

## Criterios de Verificacao

- `npm run build` passa sem erros
- Server Action `createInstance` cria instancia na Evolution e no Prisma, respeitando limite da subscription
- Server Action `deleteInstance` remove da Evolution e do Prisma
- `connectInstance` retorna QR code base64
- Webhook `messages.upsert` salva mensagem no banco
- Webhook `connection.update` atualiza status da instancia
- Pagina `/dashboard/instancias` lista instancias com status correto
- Dialog de QR code exibe imagem e faz polling de status
- `/api/webhooks/evolution` e acessivel sem JWT
- Instancias sao isoladas por empresa (multi-tenant)
