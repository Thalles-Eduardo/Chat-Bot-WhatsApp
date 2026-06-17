# Fase 2 — Autenticacao & Autorizacao

**Data:** 2026-06-17
**Status:** Aprovado para implementacao

## Contexto

Com a Fase 1 concluida (8 tabelas, migration, seed, Prisma Client singleton com adapter pattern v7), esta fase implementa autenticacao JWT e autorizacao por roles. O modelo User ja possui `email` (unique), `passwordHash`, `role` (OWNER/ADMIN/OPERATOR), `isActive`, `lastLoginAt`. bcryptjs ja esta instalado.

Next.js 16.2.7 usa `proxy.ts` em vez de `middleware.ts`. O arquivo exporta `export function proxy(request)` e usa `NextResponse` / `NextRequest`. Runtime padrao: Node.js.

## Decisoes Arquiteturais

### JWT em HttpOnly Cookies

Access token e refresh token armazenados em cookies httpOnly. Razoes:

- Protege contra XSS (JavaScript nao acessa os cookies)
- `proxy.ts` le cookies nativamente via `request.cookies`
- Padrao seguro para SaaS multi-tenant

### Biblioteca JWT: jose

Usa `jose` em vez de `jsonwebtoken`. Razoes:

- Funciona em Node.js e edge runtime
- Zero dependencias nativas
- API moderna com Promises

### Server Actions para Login/Registro

Login e registro sao Server Actions (nao API routes). Razoes:

- Integram nativamente com React/forms
- Podem setar cookies via `cookies()` do Next.js
- Tipagem end-to-end
- Validacao com Zod

### Refresh Token Rotation

A cada uso do refresh token, um novo par (access + refresh) e emitido. O refresh token anterior e invalidado implicitamente (novo token substitui o cookie). Protege contra replay attacks.

## Tokens

| Token   | Duracao    | Cookie Name     | Flags                                         |
| ------- | ---------- | --------------- | --------------------------------------------- |
| Access  | 15 minutos | `token`         | httpOnly, secure (prod), sameSite=lax, path=/ |
| Refresh | 7 dias     | `refresh_token` | httpOnly, secure (prod), sameSite=lax, path=/ |

### Payload do Access Token

```typescript
{
  sub: string; // userId
  companyId: string;
  role: UserRole; // OWNER | ADMIN | OPERATOR
  email: string;
}
```

### Payload do Refresh Token

```typescript
{
  sub: string; // userId
  type: "refresh";
}
```

## Fluxos

### Registro

1. Server Action `register` recebe: companyName, userName, email, password
2. Valida input com Zod
3. Verifica se email ja existe
4. Em uma transacao Prisma:
   - Cria Company (slug gerado a partir do nome)
   - Cria User com role OWNER e passwordHash
   - Cria Subscription FREE com limites padrao
5. Emite access token + refresh token via Set-Cookie
6. Retorna success

### Login

1. Server Action `login` recebe: email, password
2. Valida input com Zod
3. Busca User por email (inclui company)
4. Verifica se `isActive === true`
5. Compara senha com `bcrypt.compare`
6. Atualiza `lastLoginAt`
7. Emite access token + refresh token via Set-Cookie
8. Retorna success com redirect para /dashboard

### Refresh

1. Route Handler `POST /api/auth/refresh`
2. Le cookie `refresh_token`
3. Verifica e decodifica o JWT
4. Busca User no banco (verifica se ainda existe e isActive)
5. Emite novo par de tokens via Set-Cookie
6. Retorna 200

### Logout

1. Server Action `logout`
2. Remove cookies `token` e `refresh_token` (set maxAge=0)
3. Retorna success

## Protecao de Rotas (proxy.ts)

### Rotas Publicas

```
/
/login
/register
/api/auth/*
/_next/*
/favicon.ico
```

### Rotas Protegidas

```
/dashboard/*  → requer auth (qualquer role)
/api/*        → requer auth (exceto /api/auth/*)
```

### Logica do proxy.ts

1. Verifica se a rota e publica → `NextResponse.next()`
2. Le cookie `token`
3. Se ausente → redireciona para `/login`
4. Decodifica JWT (sem verificar expiracao no proxy para evitar latencia de crypto)
5. Injeta headers downstream:
   - `x-user-id`: userId
   - `x-company-id`: companyId
   - `x-user-role`: role
6. `NextResponse.next({ request: { headers } })`

Nota: A verificacao completa do JWT (assinatura + expiracao) acontece nos Server Actions/Route Handlers via `session.ts`. O proxy faz apenas decodificacao rapida para routing.

## Autorizacao por Role

### Hierarquia

```
OWNER (3) > ADMIN (2) > OPERATOR (1)
```

### Helper requireRole

```typescript
requireRole("ADMIN"); // permite ADMIN e OWNER
requireRole("OWNER"); // permite apenas OWNER
```

Usado em Server Actions e Route Handlers. Le os headers `x-user-id`, `x-company-id`, `x-user-role` injetados pelo proxy ou faz verify direto do token.

## Estrutura de Arquivos

### Criados

| Arquivo                             | Responsabilidade                                               |
| ----------------------------------- | -------------------------------------------------------------- |
| `src/lib/auth/jwt.ts`               | signAccessToken, signRefreshToken, verifyToken, cookie helpers |
| `src/lib/auth/password.ts`          | hashPassword, comparePassword (wrapper bcryptjs)               |
| `src/lib/auth/session.ts`           | getCurrentUser, requireAuth, requireRole                       |
| `src/lib/auth/constants.ts`         | Duracoes, nomes de cookies, role hierarchy                     |
| `src/actions/auth.ts`               | login, register, logout Server Actions                         |
| `src/app/api/auth/refresh/route.ts` | POST handler para refresh token rotation                       |
| `src/proxy.ts`                      | Protecao de rotas via JWT cookies                              |
| `src/validators/auth.ts`            | Schemas Zod para login e registro                              |

### Dependencia Nova

| Pacote | Versao | Razao                                          |
| ------ | ------ | ---------------------------------------------- |
| `jose` | latest | JWT sign/verify, compativel com Node.js e edge |

## Variaveis de Ambiente

Ja configuradas no `.env`:

- `JWT_SECRET` — chave para assinar access tokens
- `JWT_REFRESH_SECRET` — chave para assinar refresh tokens

## Escopo

### Inclui

- JWT sign/verify/refresh com jose
- Login e registro via Server Actions
- Logout via Server Action
- Refresh token rotation via Route Handler
- proxy.ts para protecao de rotas
- Helpers de autorizacao por role (getCurrentUser, requireAuth, requireRole)
- Hash de senha com bcryptjs
- Validacao de input com Zod

### Nao inclui

- UI de login/registro (Fase 3 — Design System)
- OAuth / social login
- Two-factor authentication (2FA)
- Reset / forgot password
- Rate limiting (Fase 7 — Queues/Redis)
- Session blacklist/revocation via Redis

## Criterios de Verificacao

- `npm run build` passa sem erros
- Server Action `register` cria company + user + subscription e seta cookies
- Server Action `login` valida credenciais e seta cookies
- `POST /api/auth/refresh` renova tokens
- Server Action `logout` limpa cookies
- `proxy.ts` redireciona para /login quando sem token
- `proxy.ts` permite acesso a rotas publicas
- `requireRole("ADMIN")` bloqueia OPERATOR mas permite ADMIN e OWNER
- `getCurrentUser()` retorna dados do usuario autenticado
