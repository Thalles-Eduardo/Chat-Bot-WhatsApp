"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { createInstanceSchema } from "@/validators/whatsapp";
import * as evolution from "@/services/evolution";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ActionResult {
  success: boolean;
  error?: string;
}

interface QRCodeResult extends ActionResult {
  qrCode?: string;
}

interface InstanceResult extends ActionResult {
  instanceId?: string;
}

export async function getInstances() {
  const user = await requireAuth();
  return prisma.whatsappInstance.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInstance(
  input: unknown
): Promise<InstanceResult> {
  const user = await requireRole("ADMIN");

  const parsed = createInstanceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name } = parsed.data;

  const subscription = await prisma.subscription.findUnique({
    where: { companyId: user.companyId },
  });

  if (!subscription) {
    return { success: false, error: "Subscription nao encontrada" };
  }

  const instanceCount = await prisma.whatsappInstance.count({
    where: { companyId: user.companyId },
  });

  if (instanceCount >= subscription.maxInstances) {
    return {
      success: false,
      error: `Limite de ${subscription.maxInstances} instancia(s) atingido`,
    };
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { slug: true },
  });

  const instanceName = `${company?.slug}-${generateSlug(name)}`;

  const existing = await prisma.whatsappInstance.findUnique({
    where: {
      companyId_instanceName: {
        companyId: user.companyId,
        instanceName,
      },
    },
  });

  if (existing) {
    return { success: false, error: "Ja existe uma instancia com esse nome" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhooks/evolution`;

  try {
    await evolution.createInstance(instanceName, webhookUrl);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar instancia";
    return { success: false, error: message };
  }

  const instance = await prisma.whatsappInstance.create({
    data: {
      companyId: user.companyId,
      name,
      instanceName,
      status: "CONNECTING",
    },
  });

  return { success: true, instanceId: instance.id };
}

export async function deleteInstance(
  instanceId: string
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const instance = await prisma.whatsappInstance.findFirst({
    where: { id: instanceId, companyId: user.companyId },
  });

  if (!instance) {
    return { success: false, error: "Instancia nao encontrada" };
  }

  try {
    await evolution.deleteInstance(instance.instanceName);
  } catch {
    // Instance may already be deleted on Evolution side
  }

  await prisma.whatsappInstance.delete({ where: { id: instanceId } });

  return { success: true };
}

export async function connectInstance(
  instanceId: string
): Promise<QRCodeResult> {
  const user = await requireAuth();

  const instance = await prisma.whatsappInstance.findFirst({
    where: { id: instanceId, companyId: user.companyId },
  });

  if (!instance) {
    return { success: false, error: "Instancia nao encontrada" };
  }

  try {
    const qr = await evolution.getQRCode(instance.instanceName);

    await prisma.whatsappInstance.update({
      where: { id: instanceId },
      data: { status: "CONNECTING" },
    });

    return { success: true, qrCode: qr.base64 };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao obter QR code";
    return { success: false, error: message };
  }
}

export async function disconnectInstance(
  instanceId: string
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const instance = await prisma.whatsappInstance.findFirst({
    where: { id: instanceId, companyId: user.companyId },
  });

  if (!instance) {
    return { success: false, error: "Instancia nao encontrada" };
  }

  try {
    await evolution.logoutInstance(instance.instanceName);
  } catch {
    // May already be disconnected
  }

  await prisma.whatsappInstance.update({
    where: { id: instanceId },
    data: { status: "DISCONNECTED", phone: null },
  });

  return { success: true };
}

export async function getInstanceQRCode(
  instanceId: string
): Promise<QRCodeResult> {
  const user = await requireAuth();

  const instance = await prisma.whatsappInstance.findFirst({
    where: { id: instanceId, companyId: user.companyId },
  });

  if (!instance) {
    return { success: false, error: "Instancia nao encontrada" };
  }

  if (instance.status === "CONNECTED") {
    return { success: true, qrCode: undefined };
  }

  try {
    const qr = await evolution.getQRCode(instance.instanceName);
    return { success: true, qrCode: qr.base64 };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao obter QR code";
    return { success: false, error: message };
  }
}
