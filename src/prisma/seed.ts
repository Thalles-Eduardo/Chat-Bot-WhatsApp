import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const company = await prisma.company.upsert({
    where: { slug: "empresa-teste" },
    update: {},
    create: {
      name: "Empresa Teste",
      slug: "empresa-teste",
      email: "contato@empresateste.com",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@teste.com" },
    update: {},
    create: {
      companyId: company.id,
      name: "Admin",
      email: "admin@teste.com",
      passwordHash,
      role: "OWNER",
    },
  });

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      plan: "FREE",
      status: "ACTIVE",
      maxInstances: 1,
      maxAgents: 1,
      maxMessagesPerMonth: 1000,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  await prisma.agent.upsert({
    where: {
      id: "00000000-0000-0000-0000-000000000001",
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      companyId: company.id,
      name: "Assistente Geral",
      description: "Agente padrão de atendimento ao cliente",
      systemPrompt:
        "Você é um assistente virtual de atendimento ao cliente. " +
        "Seja educado, objetivo e útil. Responda em português brasileiro. " +
        "Se não souber a resposta, informe que vai encaminhar para um atendente humano.",
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 1000,
    },
  });

  console.log("Seed completed successfully:");
  console.log("  - Company: Empresa Teste");
  console.log("  - User: admin@teste.com (OWNER, password: 123456)");
  console.log("  - Subscription: FREE plan");
  console.log("  - Agent: Assistente Geral");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
