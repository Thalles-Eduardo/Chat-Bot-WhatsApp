# IA WhatsApp

Plataforma SaaS de atendimento automatizado via WhatsApp com IA.

## Requisitos

- Node.js 20+
- Docker & Docker Compose
- npm

## Setup

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

   Edite `.env` com suas credenciais (OpenAI, Evolution API, JWT secrets).

3. Suba os serviços de dev (Postgres + Redis):

   ```bash
   docker compose up -d
   ```

4. Gere o Prisma Client:

   ```bash
   npm run db:generate
   ```

5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando               | Descrição                   |
| --------------------- | --------------------------- |
| `npm run dev`         | Servidor de desenvolvimento |
| `npm run build`       | Build de produção           |
| `npm run lint`        | Lint com ESLint             |
| `npm run format`      | Formatar com Prettier       |
| `npm run db:generate` | Gerar Prisma Client         |
| `npm run db:migrate`  | Rodar migrations Prisma     |
| `npm run db:studio`   | Abrir Prisma Studio         |
