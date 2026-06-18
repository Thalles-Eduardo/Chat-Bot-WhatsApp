"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { promptSchema } from "@/validators/agents";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getPrompts() {
  const user = await requireAuth();
  return prisma.prompt.findMany({
    where: { companyId: user.companyId },
    include: {
      agent: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPrompt(input: unknown): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const parsed = promptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { agentId, ...rest } = parsed.data;

  await prisma.prompt.create({
    data: {
      companyId: user.companyId,
      ...rest,
      agentId: agentId || null,
    },
  });

  return { success: true };
}

export async function updatePrompt(
  id: string,
  input: unknown
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const prompt = await prisma.prompt.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!prompt) {
    return { success: false, error: "Prompt nao encontrado" };
  }

  const parsed = promptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { agentId, ...rest } = parsed.data;

  await prisma.prompt.update({
    where: { id },
    data: {
      ...rest,
      agentId: agentId || null,
    },
  });

  return { success: true };
}

export async function togglePrompt(id: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const prompt = await prisma.prompt.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!prompt) {
    return { success: false, error: "Prompt nao encontrado" };
  }

  await prisma.prompt.update({
    where: { id },
    data: { isActive: !prompt.isActive },
  });

  return { success: true };
}

export async function deletePrompt(id: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const prompt = await prisma.prompt.findFirst({
    where: { id, companyId: user.companyId },
  });

  if (!prompt) {
    return { success: false, error: "Prompt nao encontrado" };
  }

  await prisma.prompt.delete({ where: { id } });

  return { success: true };
}
