"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { agentSchema } from "@/validators/agents";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getAgents() {
  const user = await requireAuth();
  return prisma.agent.findMany({
    where: { companyId: user.companyId },
    include: {
      _count: { select: { conversations: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAgent(id: string) {
  const user = await requireAuth();
  return prisma.agent.findFirst({
    where: { id, companyId: user.companyId },
  });
}

export async function getActiveAgents() {
  const user = await requireAuth();
  return prisma.agent.findMany({
    where: { companyId: user.companyId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createAgent(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const parsed = agentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { companyId: user.companyId },
  });

  if (subscription) {
    const agentCount = await prisma.agent.count({
      where: { companyId: user.companyId },
    });

    if (agentCount >= subscription.maxAgents) {
      return {
        success: false,
        error: `Limite de ${subscription.maxAgents} agente(s) atingido`,
      };
    }
  }

  await prisma.agent.create({
    data: {
      companyId: user.companyId,
      ...parsed.data,
    },
  });

  return { success: true };
}

export async function updateAgent(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const agent = await prisma.agent.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!agent) {
    return { success: false, error: "Agente nao encontrado" };
  }

  const parsed = agentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.agent.update({
    where: { id },
    data: parsed.data,
  });

  return { success: true };
}

export async function toggleAgent(id: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const agent = await prisma.agent.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!agent) {
    return { success: false, error: "Agente nao encontrado" };
  }

  await prisma.agent.update({
    where: { id },
    data: { isActive: !agent.isActive },
  });

  return { success: true };
}

export async function deleteAgent(id: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const agent = await prisma.agent.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!agent) {
    return { success: false, error: "Agente nao encontrado" };
  }

  await prisma.agent.delete({ where: { id } });

  return { success: true };
}
