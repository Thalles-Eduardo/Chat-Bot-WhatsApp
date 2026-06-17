@AGENTS.md

# CLAUDE.md

# Next.js Project Guidelines

Este documento define os padrões, arquitetura, estilo visual e boas práticas utilizadas nos projetos Next.js.

---

# Stack Principal

## Framework

- Next.js (App Router)
- TypeScript obrigatório
- React Server Components por padrão

## Estilização

- TailwindCSS
- CSS Modules apenas quando realmente necessário
- Evitar arquivos CSS globais excessivos

## Animações

- Framer Motion para animações de interface
- GSAP para experiências imersivas, scroll animations e storytelling

## Ícones

- Lucide React
- Font Awesome apenas em casos específicos

## Gerenciamento de Estado

- Zustand para estados globais simples
- Context API apenas quando fizer sentido
- Evitar Redux em projetos pequenos/médios

## Backend / Database

- Supabase
- Firebase
- Prisma ORM
- PostgreSQL

---

# Estrutura de Pastas

```bash
src/
│
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── sections/
│   └── shared/
│
├── hooks/
├── lib/
├── services/
├── store/
├── types/
├── utils/
├── styles/
├── public/
│   ├── images/
│   ├── icons/
│   └── videos/
│
└── constants/
```

---

# Convenções de Nomenclatura

## Componentes

- PascalCase
- Exemplo:

```tsx
HeroSection.tsx;
AnimatedButton.tsx;
PortfolioCard.tsx;
```

## Hooks

- Sempre iniciar com `use`

```tsx
useTheme.ts;
useScrollAnimation.ts;
```

## Utilitários

- camelCase

```tsx
formatCurrency.ts;
generateSlug.ts;
```

## Constantes

- UPPER_SNAKE_CASE

```tsx
NAV_LINKS;
SOCIAL_MEDIA;
```

---

# Padrões de Componentes

## Regras Gerais

- Componentes devem ser pequenos e reutilizáveis
- Evitar componentes gigantes
- Separar lógica da UI quando possível

## Client Components

Usar `"use client"` apenas quando necessário:

- hooks React
- animações
- eventos
- browser APIs

## Server Components

Preferência sempre para Server Components.

---

# Responsividade

## Mobile First

Todos os projetos devem seguir:

- mobile-first
- breakpoints bem definidos
- layout fluido

## Breakpoints padrão

```ts
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

# UI / UX Guidelines

## Estilo Visual

- Interfaces modernas
- Visual premium
- Bastante respiro visual
- Microinterações suaves
- Layout minimalista
- Hierarquia visual forte

## Preferências Visuais

- Uso frequente de tons vermelhos
- Backgrounds escuros
- Gradientes sutis
- Blur effects
- Glow effects controlados

## Botões

- Hover elegante
- Transições suaves
- Feedback visual imediato

## Regra de Cores — 60-30-10

Toda interface deve seguir a regra visual 60-30-10 para manter equilíbrio estético e hierarquia visual consistente.

### Distribuição

- 60% → cor dominante

  - normalmente background principal
  - tons escuros/neutros

- 30% → cor secundária

  - superfícies
  - cards
  - elementos de suporte

- 10% → cor de destaque

  - CTAs
  - hover states
  - detalhes importantes
  - elementos interativos

### Preferências Visuais

- Prioridade para interfaces dark
- Vermelho frequentemente utilizado como accent color
- Evitar excesso de cores vibrantes simultaneamente
- Contraste deve ser elegante e confortável
- Accent colors devem chamar atenção sem poluir a interface

### Objetivo

Criar interfaces:

- equilibradas
- sofisticadas
- modernas
- visualmente limpas
- com hierarquia clara

---

# Animações

## Framer Motion

Usar para:

- entrances
- hover effects
- reveal animations
- stagger animations

## GSAP

Usar para:

- scroll storytelling
- parallax
- timeline complexa
- experiências cinematográficas

## Regras

- Nunca exagerar
- Priorizar performance
- Evitar animações desnecessárias

---

# Performance

## Regras

- Lazy loading sempre que possível
- Utilizar `next/image`
- Evitar re-renders desnecessários
- Memoização quando fizer sentido

## Fontes

- Utilizar `next/font`
- Evitar Google Fonts externos

## Imagens

- Otimizar imagens
- Utilizar formatos modernos:

  - WebP
  - AVIF

---

# SEO

## Regras

- Metadata configurada corretamente
- Open Graph
- Twitter Cards
- Sitemap
- robots.txt

## Conteúdo

- Estrutura semântica
- Headings organizadas
- Alt text obrigatório

---

# Acessibilidade

## Obrigatório

- Navegação por teclado
- aria-labels quando necessário
- contraste adequado
- foco visível

## Evitar

- divs clicáveis sem necessidade
- animações agressivas
- textos pequenos demais

---

# Organização de Código

## Regras

- Evitar arquivos gigantes
- Funções pequenas
- Código legível
- Comentários apenas quando realmente necessários

## Preferência

Código autoexplicativo.

---

# TypeScript

## Obrigatório

- Nunca usar `any`
- Tipagem explícita
- Criar tipos reutilizáveis

## Organização

```bash
types/
```

---

# APIs

## Padrões

- Services separados
- Fetch centralizado
- Tratamento de erros consistente

## Estrutura

```bash
services/
```

---

# Forms

## Preferência

- React Hook Form
- Zod para validação

---

# Segurança

## Nunca

- Expor secrets
- Colocar chaves privadas no frontend

## Sempre

- Variáveis em `.env`

---

# Git & Commits

Sempre após a implemetação de algum trecho de código, fazer commit no padrão: "NomeArquivoAlterado + ResumoPreveMudanca", sempre peça autorização para o commit.

## Conventional Commits

```bash
feat:
fix:
refactor:
style:
perf:
docs:
```

---

# Qualidade de Código

## Ferramentas

- ESLint
- Prettier

## Regras

- Código limpo
- Padronização visual
- Organização consistente

---

# Experiência Frontend

Projetos devem transmitir:

- modernidade
- fluidez
- sofisticação
- sensação premium
- interatividade controlada

---

# Filosofia de Desenvolvimento

- Criar experiências, não apenas interfaces
- Priorizar UX acima de excesso visual
- Performance é parte do design
- Animações devem agregar valor
- Simplicidade > complexidade desnecessária

---

# Regras Gerais

## Evitar

- CSS desorganizado
- Componentes enormes
- Props excessivas
- Lógica duplicada
- Overengineering

## Priorizar

- Escalabilidade
- Reutilização
- Clareza
- Performance
- Manutenção simples
