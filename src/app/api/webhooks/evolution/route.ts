import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { processMessageWithAI } from "@/services/ai";

const STATUS_MAP: Record<string, "CONNECTED" | "DISCONNECTED" | "CONNECTING"> =
  {
    open: "CONNECTED",
    close: "DISCONNECTED",
    connecting: "CONNECTING",
  };

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("apikey");

  if (!apiKey || apiKey !== process.env.EVOLUTION_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { event, instance: instanceName } = body;

  if (!event || !instanceName) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const whatsappInstance = await prisma.whatsappInstance.findFirst({
    where: { instanceName },
    select: { id: true, companyId: true, defaultAgentId: true },
  });

  if (!whatsappInstance) {
    return NextResponse.json({ error: "Instance not found" }, { status: 404 });
  }

  if (event === "messages.upsert") {
    await handleMessageUpsert(body, whatsappInstance);
  } else if (event === "connection.update") {
    await handleConnectionUpdate(body, whatsappInstance);
  }

  return NextResponse.json({ received: true });
}

async function handleMessageUpsert(
  body: {
    data: {
      key: { remoteJid: string; fromMe: boolean; id: string };
      message?: {
        conversation?: string;
        extendedTextMessage?: { text: string };
      };
      pushName?: string;
    };
  },
  whatsappInstance: { id: string; companyId: string; defaultAgentId: string | null }
) {
  const { key, message, pushName } = body.data;

  if (key.fromMe) return;

  const contactPhone = key.remoteJid.replace("@s.whatsapp.net", "");
  const contactName = pushName || contactPhone;
  const content =
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    "";

  if (!content) return;

  let conversation = await prisma.conversation.findFirst({
    where: {
      whatsappInstanceId: whatsappInstance.id,
      contactPhone,
      status: { not: "CLOSED" },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        companyId: whatsappInstance.companyId,
        whatsappInstanceId: whatsappInstance.id,
        contactName,
        contactPhone,
        status: "PENDING",
        agentId: whatsappInstance.defaultAgentId,
      },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      companyId: whatsappInstance.companyId,
      sender: "CONTACT",
      type: "TEXT",
      content,
      whatsappMessageId: key.id,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      contactName,
    },
  });

  const agentId = conversation.agentId || whatsappInstance.defaultAgentId;

  if (agentId && !conversation.operatorId && conversation.status !== "CLOSED") {
    if (!conversation.agentId && whatsappInstance.defaultAgentId) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { agentId: whatsappInstance.defaultAgentId },
      });
    }

    try {
      await processMessageWithAI(conversation.id);
    } catch (error) {
      console.error("[AI Processing Error]", error);
    }
  }
}

async function handleConnectionUpdate(
  body: { data: { state: string } },
  whatsappInstance: { id: string }
) {
  const { state } = body.data;
  const status = STATUS_MAP[state];

  if (!status) return;

  await prisma.whatsappInstance.update({
    where: { id: whatsappInstance.id },
    data: { status },
  });
}
