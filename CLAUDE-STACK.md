@AGENTS.md

# AI PROJECT INSTRUCTIONS — WhatsApp AI SaaS

## Project Overview

This project is a professional SaaS platform for automated AI-powered customer service on WhatsApp.

The system must support:

- Multi-company architecture
- Multiple WhatsApp instances
- AI-generated responses
- Human support takeover
- Real-time conversations
- Dashboard analytics
- Audio transcription
- RAG-based knowledge systems
- Scalable infrastructure
- SaaS subscription model

---

# Core Stack

## Frontend & Backend

- Next.js (App Router)
- TypeScript
- Server Actions
- Route Handlers
- TailwindCSS
- Shadcn/UI

---

## Database

- PostgreSQL
- Prisma ORM

---

## Cache & Queues

- Redis
- BullMQ

---

## AI

- OpenAI API
- GPT models
- Whisper API
- Embeddings
- RAG architecture

---

## WhatsApp Integration

- Evolution API

---

## Infrastructure

- Docker
- Docker Compose
- Nginx
- Linux VPS
- Cloudflare

---

# Architecture Rules

## General Rules

- Always use clean architecture principles
- Keep code modular and scalable
- Avoid tightly coupled components
- Use TypeScript strictly
- Prefer server-side processing when possible
- Use async/await instead of raw promises
- Never use `any`
- Always validate inputs
- Always sanitize external data

---

# Next.js Rules

## Required

- Use App Router only
- Use Server Components by default
- Use Client Components only when necessary
- Use Server Actions whenever possible
- Use Route Handlers for APIs/webhooks
- Use Suspense where appropriate
- Keep business logic outside components

---

## Forbidden

- Do not use Pages Router
- Do not use Context API for global complex state
- Do not fetch sensitive data on client side
- Do not place business logic inside UI components
- Do not use large client-side state unnecessarily

---

# Folder Structure

```
src/
├── app/
├── components/
├── services/
├── lib/
├── hooks/
├── prisma/
├── types/
├── validators/
├── whatsapp/
├── ai/
├── actions/
├── queues/
├── utils/
└── config/
```

---

# Coding Standards

## TypeScript

- Use interfaces for objects
- Use type inference when appropriate
- Avoid enums when unions are sufficient
- Use Zod for validation
- Prefer composition over inheritance

---

## Naming

### Variables

Use:

- camelCase

Example:

```ts
const userMessage = "";
```

---

### Components

Use:

- PascalCase

Example:

```tsx <ConversationCard />

```

---

### Files

Use:

- kebab-case

Example:

```
conversation-card.tsx
```

---

# API Rules

## Route Handlers

Use:

```
app/api/
```

Structure:

```
app/api/webhook/route.ts
```

---

## Responses

Always return standardized JSON:

```ts
return Response.json({
  success: true,
  data,
});
```

---

# Database Rules

## Prisma

- Use Prisma ORM
- Always use relations properly
- Avoid duplicated queries
- Use transactions when needed
- Optimize database access

---

## Main Tables

- companies
- users
- conversations
- messages
- agents
- whatsapp_instances
- subscriptions
- prompts

---

# AI Rules

## AI Responses

Responses must:

- Sound natural
- Be humanized
- Be concise
- Avoid robotic tone
- Respect company context
- Maintain conversation memory

---

## Prompt Engineering

Always separate:

- system prompt
- user message
- conversation history
- company instructions

---

## Context

AI must consider:

- Previous messages
- Company instructions
- User metadata
- Current conversation state

---

# WhatsApp Rules

## Messaging

- Simulate human delays
- Avoid spam behavior
- Respect cooldowns
- Queue outgoing messages
- Handle reconnects

---

## Webhooks

All webhooks must:

- Validate payloads
- Verify signatures
- Log failures
- Retry safely

---

# Authentication Rules

## Auth

Use:

- JWT
- HttpOnly cookies
- Refresh tokens

---

## Security

Never:

- Expose secrets
- Store plaintext passwords
- Trust client-side validation
- Expose internal APIs publicly

---

# UI/UX Rules

## Design System

Use:

- TailwindCSS
- Shadcn/UI

---

## Color System

Follow:

- 60-30-10 rule

Where:

- 60% neutral base
- 30% secondary color
- 10% accent color

---

## UI Principles

Interfaces must be:

- Clean
- Modern
- Responsive
- Minimalist
- Fast
- Accessible

---

# Performance Rules

## Optimize

- Database queries
- API responses
- Component rendering
- Bundle size
- Image loading

---

## Use

- Lazy loading
- Dynamic imports
- Memoization carefully
- Streaming when useful

---

# Queue Rules

Use BullMQ for:

- Message queues
- Audio processing
- AI processing
- Retry systems
- Scheduled jobs

---

# Redis Rules

Use Redis for:

- Cache
- Session storage
- Rate limiting
- Cooldowns
- Temporary conversation state

---

# Error Handling

Always:

- Handle errors gracefully
- Log important failures
- Return user-friendly responses
- Avoid leaking internal details

---

# Logging

Use structured logs.

Log:

- AI requests
- WhatsApp events
- Authentication events
- Errors
- Queue failures

---

# SaaS Architecture

The system must support:

- Multi-tenant architecture
- Isolated company data
- Subscription plans
- Usage limits
- Billing integration
- Multiple agents per company

---

# Scalability Rules

Code must be designed for:

- Horizontal scaling
- Queue-based processing
- Stateless APIs
- Distributed systems

---

# Docker Rules

Every service must run in containers.

Main services:

- nextjs
- postgres
- redis
- evolution-api
- nginx

---

# Forbidden Practices

Never:

- Use inline styles excessively
- Create giant components
- Mix business logic with UI
- Use hardcoded secrets
- Ignore loading states
- Ignore empty states
- Ignore accessibility
- Ignore validation
- Ignore typing

---

# Preferred Libraries

## Validation

- Zod

## Forms

- React Hook Form

## State

- Zustand

## Tables

- TanStack Table

## Animations

- Framer Motion

## Date Handling

- date-fns

---

# Development Philosophy

Prioritize:

1. Scalability
2. Clean code
3. Maintainability
4. Developer experience
5. Performance
6. Security
7. User experience

---

# Final Goal

Build a scalable and professional AI SaaS platform for WhatsApp automation capable of serving multiple companies with high performance, modern architecture, and excellent user experience.
