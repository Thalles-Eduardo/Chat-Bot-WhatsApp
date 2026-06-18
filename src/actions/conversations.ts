"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import * as evolution from "@/services/evolution";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getConversations(status?: string) {
  const user = await requireAuth();

  const where: Record<string, unknown> = { companyId: user.companyId };
  if (status && status !== "ALL") {
    where.status = status;
  }

  return prisma.conversation.findMany({
    where,
    include: {
      whatsappInstance: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, sender: true },
      },
    },
    orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
  });
}

export async function getMessages(conversationId: string) {
  const user = await requireAuth();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, companyId: user.companyId },
  });

  if (!conversation) {
    return [];
  }

  await prisma.message.updateMany({
    where: {
      conversationId,
      sender: "CONTACT",
      isRead: false,
    },
    data: { isRead: true },
  });

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<ActionResult> {
  const user = await requireAuth();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, companyId: user.companyId },
    include: { whatsappInstance: true },
  });

  if (!conversation) {
    return { success: false, error: "Conversa nao encontrada" };
  }

  if (conversation.status === "CLOSED") {
    return { success: false, error: "Conversa fechada" };
  }

  try {
    await evolution.sendTextMessage(
      conversation.whatsappInstance.instanceName,
      conversation.contactPhone,
      text
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao enviar mensagem";
    return { success: false, error: message };
  }

  await prisma.message.create({
    data: {
      conversationId,
      companyId: user.companyId,
      sender: "OPERATOR",
      type: "TEXT",
      content: text,
    },
  });

  const updates: Record<string, unknown> = {
    lastMessageAt: new Date(),
  };
  if (conversation.status === "PENDING") {
    updates.status = "HUMAN_HANDLING";
  }
  if (!conversation.operatorId) {
    updates.operatorId = user.userId;
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: updates,
  });

  return { success: true };
}

export async function updateConversationStatus(
  conversationId: string,
  status: string
): Promise<ActionResult> {
  const user = await requireAuth();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, companyId: user.companyId },
  });

  if (!conversation) {
    return { success: false, error: "Conversa nao encontrada" };
  }

  const validStatuses = ["PENDING", "AI_HANDLING", "HUMAN_HANDLING", "CLOSED"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Status invalido" };
  }

  const data: Record<string, unknown> = { status };
  if (status === "CLOSED") {
    data.closedAt = new Date();
  }
  if (status === "PENDING") {
    data.closedAt = null;
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data,
  });

  return { success: true };
}

export async function assignOperator(
  conversationId: string,
  operatorId: string | null
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, companyId: user.companyId },
  });

  if (!conversation) {
    return { success: false, error: "Conversa nao encontrada" };
  }

  if (operatorId) {
    const operator = await prisma.user.findFirst({
      where: { id: operatorId, companyId: user.companyId },
    });
    if (!operator) {
      return { success: false, error: "Operador nao encontrado" };
    }
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { operatorId },
  });

  return { success: true };
}
