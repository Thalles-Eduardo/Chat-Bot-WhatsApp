# Fase 5 — Conversations UI / Inbox

**Data:** 2026-06-18
**Status:** Aprovado para implementacao

## Contexto

Fases 0-4 completas. O webhook da Evolution API ja salva mensagens recebidas no banco (Conversation + Message). A tabela Conversation tem campos: contactName, contactPhone, status (PENDING/IN_PROGRESS/CLOSED), operatorId (nullable), lastMessageAt. A tabela Message tem: sender (CONTACT/AI/OPERATOR/SYSTEM), type, content, isRead, createdAt. O sidebar ja tem link para `/dashboard/conversas` (MessageSquare icon). O `sendTextMessage` do evolution service esta pronto. A pagina ainda nao existe.

## Decisoes Arquiteturais

### Layout Full-Height sem Padding

O dashboard layout atual aplica `p-6` ao `<main>`. O inbox precisa ocupar toda a altura disponivel (sem padding), pois tanto a lista de conversas quanto o chat precisam de scroll independente. Solucao: a pagina de conversas usa classes para negar o padding do layout pai (`-m-6`) ou o layout de conversas e ajustado com um layout proprio que remove o padding.

Abordagem escolhida: a pagina de conversas aplica `-m-6` no container externo para negar o padding do dashboard layout, mantendo o layout existente intacto.

### URL-Based Selection

A conversa selecionada e identificada via search param `?id=xxx`. Isso permite:
- Server Components para o fetch inicial das mensagens
- URLs compartilhaveis/bookmarkable
- Back button funciona naturalmente no mobile

### Server Components + Client Islands

A pagina principal e Server Component que busca conversas e (opcionalmente) mensagens da conversa selecionada. Client Components cuidam de interatividade: filtros, selecao, envio de mensagens, polling.

### Polling para Atualizacoes

Sem WebSocket/SSE nesta fase. O ChatView faz polling a cada 3 segundos para novas mensagens. A ConversationList faz polling a cada 5 segundos para atualizar a lista. Redis queues e real-time ficam para Fase 7.

## Server Actions — `src/actions/conversations.ts`

### `getConversations(status?: string)`

1. `requireAuth()`
2. Busca conversas da empresa do usuario, filtrada por status se fornecido
3. Inclui relacao com `whatsappInstance` (para saber de qual instancia veio)
4. Ordena por `lastMessageAt` desc (mais recentes primeiro)
5. Retorna array de conversas com campos: id, contactName, contactPhone, status, lastMessageAt, operatorId, whatsappInstance.name

### `getMessages(conversationId: string)`

1. `requireAuth()`
2. Verifica que conversa pertence a empresa do usuario
3. Busca mensagens ordenadas por createdAt asc
4. Marca mensagens nao lidas de CONTACT como lidas (`isRead: true`)
5. Retorna array de mensagens

### `sendMessage(conversationId: string, text: string)`

1. `requireAuth()`
2. Busca conversa (verifica ownership) com include de whatsappInstance
3. Chama `evolution.sendTextMessage(instance.instanceName, conversation.contactPhone, text)`
4. Cria Message com sender OPERATOR, type TEXT
5. Se conversa estava PENDING, atualiza para IN_PROGRESS
6. Se conversa nao tem operatorId, define como o usuario atual
7. Atualiza `lastMessageAt`
8. Retorna `{ success: true }`

### `updateConversationStatus(conversationId: string, status: string)`

1. `requireAuth()`
2. Busca conversa (verifica ownership)
3. Valida que status e valido (PENDING, IN_PROGRESS, CLOSED)
4. Atualiza status. Se CLOSED, define `closedAt`
5. Retorna `{ success: true }`

### `assignOperator(conversationId: string, operatorId: string | null)`

1. `requireRole("ADMIN")`
2. Busca conversa (verifica ownership)
3. Se operatorId fornecido, verifica que usuario existe e pertence a mesma empresa
4. Atualiza `operatorId`
5. Retorna `{ success: true }`

## Componentes

### Pagina — `src/app/(dashboard)/dashboard/conversas/page.tsx`

Server Component. Recebe `searchParams` para obter `id` da conversa selecionada. Busca lista de conversas e, se `id` presente, busca mensagens da conversa selecionada. Renderiza o layout de inbox com ConversationList e ChatView.

```
<div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
  <ConversationList conversations={conversations} selectedId={id} />
  {selectedConversation ? (
    <ChatView conversation={selectedConversation} messages={messages} />
  ) : (
    <EmptyState />
  )}
</div>
```

### ConversationList — `src/components/sections/conversation-list.tsx`

Client Component. Recebe `conversations[]` e `selectedId`.

- Barra superior com filtros por status: Todas, Pendentes, Em atendimento, Fechadas
- Campo de busca para filtrar por nome/telefone (client-side filtering)
- Lista scrollavel de ConversationItem
- No mobile: ocupa 100% da largura quando nenhuma conversa selecionada
- Largura fixa: `w-80` no desktop, `w-full` no mobile

### ConversationItem — `src/components/sections/conversation-item.tsx`

Client Component. Renderiza um item na lista:

- Avatar com iniciais do contato
- Nome do contato (truncado)
- Preview da ultima mensagem (truncado, max 1 linha)
- Hora relativa da ultima mensagem (usando Intl.RelativeTimeFormat ou formatacao simples)
- Badge de status (mesmo estilo da pagina de instancias)
- Indicador de nao lido (dot)
- Background diferenciado quando selecionado

### ChatView — `src/components/sections/chat-view.tsx`

Client Component. Recebe `conversation` e `messages[]` iniciais.

**Header do chat:**
- Nome do contato + telefone
- Badge de status
- Dropdown com acoes: Marcar como em atendimento, Fechar conversa, Reabrir

**Area de mensagens:**
- Scroll container com scroll automatico para o final
- Mensagens renderizadas como bolhas (MessageBubble)
- Polling a cada 3 segundos via `getMessages()` para novas mensagens
- Auto-scroll quando novas mensagens chegam

**Input area:**
- ChatInput component na parte inferior
- Desabilitado se conversa esta CLOSED

### MessageBubble — `src/components/sections/message-bubble.tsx`

Client Component. Renderiza uma mensagem individual:

- CONTACT: alinhado a esquerda, bg-muted
- OPERATOR: alinhado a direita, bg-primary text-primary-foreground
- AI: alinhado a direita, bg-primary/80 com icone de bot
- SYSTEM: centralizado, texto menor, bg-transparent
- Horario abaixo da mensagem (HH:mm)

### ChatInput — `src/components/sections/chat-input.tsx`

Client Component. Input de texto + botao enviar:

- Textarea (auto-resize) + botao Send
- Enter para enviar, Shift+Enter para nova linha
- Desabilitado durante envio (isPending)
- Apos envio, limpa o campo e faz refresh para mostrar a mensagem

### ConversationStatusActions — `src/components/sections/conversation-status-actions.tsx`

Client Component. Dropdown no header do chat com acoes de status:

- "Iniciar atendimento" (PENDING → IN_PROGRESS) — visivel quando PENDING
- "Fechar conversa" (→ CLOSED) — visivel quando PENDING ou IN_PROGRESS
- "Reabrir" (CLOSED → PENDING) — visivel quando CLOSED

## Estrutura de Arquivos

### Criados

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/actions/conversations.ts` | Server Actions para conversas e mensagens |
| `src/app/(dashboard)/dashboard/conversas/page.tsx` | Pagina de inbox (Server Component) |
| `src/components/sections/conversation-list.tsx` | Lista lateral de conversas com filtros |
| `src/components/sections/conversation-item.tsx` | Item individual na lista |
| `src/components/sections/chat-view.tsx` | Chat view com mensagens e input |
| `src/components/sections/message-bubble.tsx` | Bolha de mensagem individual |
| `src/components/sections/chat-input.tsx` | Input de texto + enviar |
| `src/components/sections/conversation-status-actions.tsx` | Dropdown de acoes de status |

### Nao modifica arquivos existentes

O layout do dashboard permanece intacto. A pagina de conversas usa `-m-6` para negar o padding.

### Shadcn components necessarios

Verificar se `scroll-area` e necessario. Caso nao, usar overflow-y-auto nativo. Nenhum novo componente Shadcn obrigatorio — dialog, badge, button, dropdown-menu, input ja estao instalados.

## Responsividade

### Desktop (md+)

- Lista fixa a esquerda (w-80), chat flex-1 a direita
- Ambos com scroll independente

### Mobile (<md)

- Se nenhuma conversa selecionada: lista ocupa 100%
- Se conversa selecionada: chat ocupa 100% com botao "Voltar" que remove o `?id` param
- Transicao natural via URL params

## Estilo Visual

- Segue o design system dark com accent vermelho
- Bolhas de mensagem com cantos arredondados
- Hover states suaves na lista de conversas
- Badge de status reutiliza o padrao da pagina de instancias
- Area de mensagens com bg sutilmente diferente do fundo

## Escopo

### Inclui

- Lista de conversas com filtro por status e busca por nome/telefone
- Chat view com historico de mensagens
- Envio de respostas texto via Evolution API
- Atualizacao de status (PENDING → IN_PROGRESS → CLOSED)
- Atribuicao automatica de operador ao responder
- Atribuicao manual de operador (ADMIN)
- Polling para novas mensagens (3s) e conversas (5s)
- Layout responsivo (mobile-first)
- Empty states
- Marcacao de mensagens como lidas

### Nao inclui

- Envio de midia (imagens, audio, documentos)
- Notificacoes real-time via WebSocket/SSE (Fase 7)
- Respostas automaticas da IA (Fase 6)
- Busca full-text nas mensagens
- Paginacao de mensagens (assume volume gerenciavel por ora)
- Indicador de "digitando"

## Criterios de Verificacao

- `npm run build` passa sem erros
- `/dashboard/conversas` renderiza lista vazia quando nao ha conversas
- Selecionar conversa exibe o chat com historico de mensagens
- Enviar mensagem chama Evolution API e salva no DB com sender OPERATOR
- Status da conversa muda para IN_PROGRESS ao enviar primeira resposta
- Filtros por status funcionam corretamente
- Busca por nome/telefone filtra a lista client-side
- Layout responsivo: mobile mostra lista OU chat, desktop mostra ambos
- Polling atualiza mensagens e lista automaticamente
- Mensagens de CONTACT aparecem a esquerda, OPERATOR a direita
