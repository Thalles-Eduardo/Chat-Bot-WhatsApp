# IA WhatsApp — Mapa de Implementacoes

Documentacao de todos os arquivos implementados no projeto, organizados por fase e responsabilidade.

---

## Fase 0 — Infraestrutura Base

| Arquivo | Descricao |
|---------|-----------|
| `src/prisma/schema.prisma` | Schema do banco com 8 models (Company, User, WhatsappInstance, Agent, Prompt, Conversation, Message, Subscription) e 7 enums. Multi-tenant via companyId. |
| `src/prisma/seed.ts` | Script de seed para popular o banco com dados iniciais de teste. |
| `src/lib/prisma.ts` | Singleton do PrismaClient com adapter pattern (Prisma v7 + pg driver). |
| `src/lib/utils.ts` | Utilitario `cn()` para merge de classes CSS (clsx + tailwind-merge). |
| `src/app/globals.css` | Variaveis CSS do design system: tema dark com accent vermelho (oklch), Tailwind 4. |
| `src/app/layout.tsx` | Root layout: `lang="pt-BR"`, classe `dark`, metadata global, fonte Inter via next/font. |
| `src/proxy.ts` | Proxy (middleware Next.js 16): verifica JWT, injeta headers x-user-*, redireciona nao autenticados, exclui rotas publicas e webhooks. |
| `docker-compose.yml` | PostgreSQL 16 (porta 5432) + Redis 7 (porta 6379) em containers Alpine. |
| `.env` | Variaveis de ambiente: DATABASE_URL, JWT_SECRET, EVOLUTION_API_URL, EVOLUTION_API_KEY. |

---

## Fase 1 — Autenticacao

| Arquivo | Descricao |
|---------|-----------|
| `src/lib/auth/jwt.ts` | Funcoes para assinar/verificar tokens JWT (jose): access token (15min) + refresh token (7d), set/clear cookies httpOnly. |
| `src/lib/auth/password.ts` | Hash e comparacao de senhas com bcryptjs. |
| `src/lib/auth/session.ts` | `getCurrentUser()` extrai usuario dos headers ou cookie. `requireAuth()` e `requireRole()` para proteger server actions. |
| `src/lib/auth/constants.ts` | Constantes de auth: nomes dos cookies, tempos de expiracao, hierarquia de roles (OWNER > ADMIN > OPERATOR), rotas publicas, prefixos de API. |
| `src/validators/auth.ts` | Schemas Zod para login (email + senha) e registro (empresa + nome + email + senha). |
| `src/actions/auth.ts` | Server Actions: `login` (valida credenciais, gera tokens), `register` (cria empresa + usuario + subscription), `logout` (limpa cookies). |
| `src/app/api/auth/refresh/route.ts` | Route handler GET para renovar access token usando refresh token. |

---

## Fase 2 — Paginas de Auth

| Arquivo | Descricao |
|---------|-----------|
| `src/app/(auth)/layout.tsx` | Layout split-screen: painel esquerdo com logo + tagline (hidden no mobile), painel direito com formulario. |
| `src/app/(auth)/login/page.tsx` | Pagina de login: Server Component com metadata, renderiza AuthForm mode="login". |
| `src/app/(auth)/register/page.tsx` | Pagina de registro: Server Component com metadata, renderiza AuthForm mode="register". |
| `src/components/sections/auth-form.tsx` | Formulario de auth reutilizavel: usa `mode` prop para alternar entre login/registro, React Hook Form + Zod v4, useTransition para submit. |

---

## Fase 3 — Design System e Dashboard Shell

| Arquivo | Descricao |
|---------|-----------|
| `src/app/(dashboard)/layout.tsx` | Layout do dashboard: verifica auth, busca dados do usuario, renderiza SidebarProvider + AppSidebar + DashboardHeader + main. |
| `src/app/(dashboard)/dashboard/page.tsx` | Pagina inicial do dashboard: 4 cards de estatisticas (conversas, mensagens, agentes, instancias) com valores placeholder. |
| `src/app/page.tsx` | Rota raiz: redireciona para `/dashboard`. |
| `src/components/layout/app-sidebar.tsx` | Sidebar com navegacao (Dashboard, Conversas, Agentes, Instancias, Configuracoes), logo, dropdown do usuario com logout. Usa render prop (base-nova). |
| `src/components/layout/dashboard-header.tsx` | Header do dashboard: SidebarTrigger + Separator. |
| `src/components/shared/logo.tsx` | Logo do app: icone MessageSquare + texto "IA WhatsApp", suporta prop `collapsed`. |
| `src/hooks/use-mobile.ts` | Hook para detectar viewport mobile (breakpoint 768px). |

### Componentes UI (Shadcn/UI base-nova)

| Arquivo | Descricao |
|---------|-----------|
| `src/components/ui/button.tsx` | Botao com variantes (default, ghost, outline, destructive, secondary, link) e tamanhos (default, sm, lg, icon). |
| `src/components/ui/input.tsx` | Campo de input estilizado. |
| `src/components/ui/label.tsx` | Label para formularios. |
| `src/components/ui/card.tsx` | Card com Header, Title, Description, Content, Footer. |
| `src/components/ui/avatar.tsx` | Avatar com AvatarFallback para iniciais. |
| `src/components/ui/sidebar.tsx` | Sistema de sidebar colapsavel com SidebarProvider, Menu, MenuItem, MenuButton, Groups. |
| `src/components/ui/sheet.tsx` | Painel lateral deslizante (usado pelo sidebar no mobile). |
| `src/components/ui/separator.tsx` | Linha divisoria horizontal/vertical. |
| `src/components/ui/skeleton.tsx` | Placeholder animado para loading states. |
| `src/components/ui/tooltip.tsx` | Tooltip com posicionamento automatico. |
| `src/components/ui/dropdown-menu.tsx` | Menu dropdown com itens, separadores, suporte a render prop. |
| `src/components/ui/dialog.tsx` | Modal dialog com overlay, header, title, description, close button. |
| `src/components/ui/table.tsx` | Tabela semantica com Header, Body, Row, Head, Cell. |
| `src/components/ui/badge.tsx` | Badge com variantes (default, secondary, destructive, outline, ghost, link). |

---

## Fase 4 — Integracao WhatsApp (Evolution API)

| Arquivo | Descricao |
|---------|-----------|
| `src/services/evolution.ts` | Client HTTP para Evolution API: `evolutionFetch` centralizado com auth por apikey. 6 funcoes exportadas: createInstance, deleteInstance, getInstanceStatus, getQRCode, sendTextMessage, logoutInstance. |
| `src/validators/whatsapp.ts` | Schemas Zod: createInstanceSchema (nome min 2 chars), sendMessageSchema (phone + text). |
| `src/actions/whatsapp.ts` | Server Actions para instancias: getInstances, createInstance (com limite de subscription), deleteInstance, connectInstance, disconnectInstance, getInstanceQRCode. Verificacao de role (ADMIN para criar/deletar). |
| `src/app/api/webhooks/evolution/route.ts` | Webhook POST para Evolution API: autentica via header apikey, trata eventos `messages.upsert` (salva mensagem + cria conversa) e `connection.update` (atualiza status da instancia). |
| `src/app/(dashboard)/dashboard/instancias/page.tsx` | Pagina de instancias: Server Component com tabela listando instancias, badges de status (Conectado/Conectando/Desconectado), botao "Nova instancia". |
| `src/components/sections/create-instance-dialog.tsx` | Dialog para criar nova instancia WhatsApp: campo nome, submit via createInstance action, feedback de erro. |
| `src/components/sections/qr-code-dialog.tsx` | Dialog com QR code base64 para conexao WhatsApp: polling a cada 5s, fecha automaticamente quando conectado. |
| `src/components/sections/instance-actions.tsx` | Botoes de acao por instancia: Conectar (QR code), Desconectar, Excluir. Usa useTransition para estados de loading. |

---

## Fase 5 — Conversations UI / Inbox

| Arquivo | Descricao |
|---------|-----------|
| `src/actions/conversations.ts` | Server Actions para conversas: getConversations (com filtro por status), getMessages (marca como lidas), sendMessage (envia via Evolution + salva + auto-atribui operador), updateConversationStatus, assignOperator. |
| `src/app/(dashboard)/dashboard/conversas/page.tsx` | Pagina de inbox: Server Component com layout split (lista + chat). Selecao via searchParams `?id=xxx`. Nega padding do layout pai com `-m-6` para ocupar viewport inteiro. |
| `src/components/sections/conversation-list.tsx` | Lista lateral de conversas: filtros por status (pill buttons), busca por nome/telefone (client-side), polling a cada 5s, responsivo (hidden no mobile quando conversa selecionada). |
| `src/components/sections/conversation-item.tsx` | Item na lista de conversas: avatar com iniciais, nome truncado, preview da ultima mensagem, horario relativo, dot colorido de status. Link para selecao via query param. |
| `src/components/sections/chat-view.tsx` | Painel de chat: header com nome/telefone/status/acoes, area de mensagens com scroll e polling 3s, ChatInput na base. Desabilita input quando conversa fechada. |
| `src/components/sections/message-bubble.tsx` | Bolha de mensagem: CONTACT (esquerda, bg-muted), OPERATOR (direita, bg-primary), AI (direita, bg-primary/80 com icone bot), SYSTEM (centralizado, texto menor). Horario HH:mm. |
| `src/components/sections/chat-input.tsx` | Input de mensagem: textarea com auto-resize (max 120px), Enter para enviar, Shift+Enter para nova linha, botao Send, integra com sendMessage action. |
| `src/components/sections/conversation-status-actions.tsx` | Dropdown no header do chat: "Iniciar atendimento" (PENDING→IN_PROGRESS), "Fechar conversa" (→CLOSED), "Reabrir" (CLOSED→PENDING). |

---

## Estrutura de Rotas

| Rota | Tipo | Descricao |
|------|------|-----------|
| `/` | Static | Redirect para `/dashboard` |
| `/login` | Static | Pagina de login |
| `/register` | Static | Pagina de registro |
| `/dashboard` | Dynamic | Dashboard com cards de estatisticas |
| `/dashboard/conversas` | Dynamic | Inbox de conversas WhatsApp |
| `/dashboard/instancias` | Dynamic | Gerenciamento de instancias WhatsApp |
| `/api/auth/refresh` | Dynamic | Renovacao de access token |
| `/api/webhooks/evolution` | Dynamic | Webhook da Evolution API (publico) |

---

## Fases Futuras (Planejadas)

| Fase | Descricao |
|------|-----------|
| Fase 6 | IA / RAG — Processamento de mensagens com IA, knowledge base |
| Fase 7 | Filas / Redis — Processamento assincrono, rate limiting, real-time |
| Fase 8 | SaaS Billing — Planos, pagamentos, limites |
| Fase 9 | Analytics — Dashboard com metricas e graficos |
| Fase 10 | Infra / Deploy — CI/CD, producao |
