# Fase 3 — Design System & Auth UI

**Data:** 2026-06-17
**Status:** Aprovado para implementacao

## Contexto

Fases 0-2 completas: estrutura, banco de dados (8 tabelas), autenticacao JWT (Server Actions, proxy.ts, roles). Shadcn/UI inicializado (base-nova style, neutral base, Lucide icons, Tailwind v4 inline theme). Apenas o componente Button instalado. Layout raiz basico com Geist fonts. Tema dark disponivel via `.dark` class mas nao ativado por padrao.

## Decisoes Arquiteturais

### Tema Dark por Padrao com Accent Vermelho

Seguindo a regra 60-30-10 do CLAUDE.md:

- **60% dominante:** backgrounds escuros (oklch neutros ja definidos no .dark do Shadcn)
- **30% secundario:** cards, surfaces, sidebar (oklch 0.205-0.269)
- **10% accent:** vermelho como `--primary` — CTAs, hovers, detalhes interativos

Customizacao das CSS variables no `.dark`:
- `--primary`: `oklch(0.637 0.237 25.331)` (vermelho vibrante)
- `--primary-foreground`: `oklch(0.985 0 0)` (branco)
- `--ring`: `oklch(0.637 0.237 25.331 / 40%)` (vermelho com opacidade para focus rings)
- `--sidebar-primary`: `oklch(0.637 0.237 25.331)` (vermelho na sidebar tambem)

As variaveis `:root` (light mode) tambem recebem vermelho como primary para consistencia, mas o app usa dark por padrao.

### Route Groups para Layouts

- `(auth)` — layout centralizado sem sidebar para login/register
- `(dashboard)` — layout com sidebar + header para area autenticada

### Componentes Shadcn a Instalar

Via `npx shadcn add`: `input`, `label`, `card`, `separator`, `avatar`, `dropdown-menu`, `tooltip`, `sidebar`, `skeleton`.

### Forms com React Hook Form + Zod

Login e registro usam React Hook Form com `@hookform/resolvers/zod` (ja instalados) e os schemas de `src/validators/auth.ts` (Fase 2). Server Actions de `src/actions/auth.ts` sao chamadas no submit.

## Estrutura de Paginas

```
src/app/
├── (auth)/
│   ├── layout.tsx          — layout centralizado para auth (sem sidebar)
│   ├── login/page.tsx      — form de login
│   └── register/page.tsx   — form de registro
├── (dashboard)/
│   ├── layout.tsx          — layout com sidebar + header
│   └── dashboard/page.tsx  — pagina inicial do dashboard (placeholder)
├── layout.tsx              — root layout (dark class, fonts, metadata)
└── page.tsx                — redireciona para /dashboard
```

## Layout Auth — `(auth)/layout.tsx`

Tela dividida (split screen):
- **Lado esquerdo (hidden no mobile):** background escuro com gradiente sutil, logo, tagline "Atendimento inteligente via WhatsApp", glow vermelho sutil decorativo
- **Lado direito:** card centralizado com formulario

No mobile: apenas o card de formulario com fundo escuro, sem split.

## Layout Dashboard — `(dashboard)/layout.tsx`

### Sidebar (Shadcn Sidebar)

- Logo/brand no topo
- Navegacao principal:
  - Dashboard (LayoutDashboard icon)
  - Conversas (MessageSquare icon)
  - Agentes (Bot icon)
  - Instancias WhatsApp (Smartphone icon)
  - Configuracoes (Settings icon)
- User menu no rodape: avatar com iniciais, nome, email, dropdown com opcao de logout
- Colapsavel em mobile (sheet overlay) e desktop (icon-only)

### Header

- Mobile menu trigger (sidebar toggle)
- Breadcrumb baseado na rota atual
- Spacer

## Forms de Login/Registro

### Login (`(auth)/login/page.tsx`)

- Campos: email, password
- Botao "Entrar" com loading state
- Link "Nao tem conta? Registre-se"
- Mensagem de erro inline (vem do Server Action)

### Registro (`(auth)/register/page.tsx`)

- Campos: companyName, name, email, password
- Botao "Criar conta" com loading state
- Link "Ja tem conta? Entre"
- Mensagem de erro inline

### Form Component — `AuthForm`

Componente reutilizavel client-side que encapsula:
- React Hook Form com Zod resolver
- Renderizacao dos campos via props (configuracao de fields)
- Submit handler que chama Server Action
- Estado de loading e erro
- Animacao de transicao com Framer Motion (fade in)

## Componentes Criados

| Componente | Path | Responsabilidade |
|-----------|------|-----------------|
| `AuthForm` | `src/components/sections/auth-form.tsx` | Form reutilizavel (login + register) com RHF + Zod |
| `AppSidebar` | `src/components/layout/app-sidebar.tsx` | Sidebar do dashboard com nav items + user menu |
| `DashboardHeader` | `src/components/layout/dashboard-header.tsx` | Header com sidebar trigger + breadcrumb |
| `Logo` | `src/components/shared/logo.tsx` | Logo SVG reutilizavel (nome + icone) |

## Componentes Shadcn Necessarios

`input`, `label`, `card`, `separator`, `avatar`, `dropdown-menu`, `tooltip`, `sidebar`, `skeleton`

## Metadata/SEO

Root layout atualizado:
- title: "IA WhatsApp — Atendimento Inteligente"
- description: "Plataforma SaaS de atendimento ao cliente via WhatsApp com inteligencia artificial"
- lang: "pt-BR"

## Escopo

### Inclui
- Tema dark com accent vermelho (CSS variables)
- Componentes Shadcn instalados (9 componentes)
- Paginas de login e registro funcionais
- Dashboard layout com sidebar + header
- Pagina dashboard placeholder
- Root page redireciona para /dashboard
- Componentes: AuthForm, AppSidebar, DashboardHeader, Logo
- Metadata basica

### Nao inclui
- Paginas internas do dashboard (Conversas, Agentes, etc — fases posteriores)
- Animacoes complexas GSAP (futuro)
- Landing page publica
- Theme toggle (light/dark) — app e dark-only por design
- OAuth buttons

## Criterios de Verificacao

- `npm run build` passa sem erros
- Tema dark ativo com accent vermelho visivel nos botoes e focus rings
- `/login` renderiza form funcional que autentica via Server Action
- `/register` renderiza form funcional que cria conta via Server Action
- `/dashboard` mostra layout com sidebar colapsavel e header
- Sidebar mostra 5 nav items e user menu com logout
- Mobile: sidebar vira sheet overlay, auth layout sem split
- Redirect: `/` redireciona para `/dashboard` (autenticado) ou `/login` (nao autenticado)
