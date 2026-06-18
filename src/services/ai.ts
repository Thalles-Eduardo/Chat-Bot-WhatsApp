import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { sendTextMessage } from "@/services/evolution";

const client = new Anthropic();

const THINKING_MODELS = ["claude-opus", "claude-sonnet", "claude-fable"];

function supportsThinking(model: string): boolean {
  return THINKING_MODELS.some((prefix) => model.startsWith(prefix));
}

function composeSystemPrompt(
  agentSystemPrompt: string,
  prompts: { title: string; content: string }[]
): string {
  if (prompts.length === 0) return agentSystemPrompt;

  const knowledgeBase = prompts
    .map((p) => `## ${p.title}\n${p.content}`)
    .join("\n\n");

  return `${agentSystemPrompt}\n\n---\n\nBase de Conhecimento:\n\n${knowledgeBase}`;
}

function buildMessages(
  messages: { sender: string; content: string }[]
): Anthropic.MessageParam[] {
  const mapped: Anthropic.MessageParam[] = [];

  for (const msg of messages) {
    if (msg.sender === "SYSTEM") continue;

    const role: "user" | "assistant" =
      msg.sender === "CONTACT" ? "user" : "assistant";

    mapped.push({ role, content: msg.content });
  }

  if (mapped.length === 0 || mapped[0].role !== "user") {
    return [];
  }

  return mapped;
}

export async function processMessageWithAI(
  conversationId: string
): Promise<void> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      agent: {
        include: {
          prompts: {
            where: { isActive: true },
            select: { title: true, content: true },
          },
        },
      },
      whatsappInstance: {
        select: { instanceName: true, companyId: true },
      },
    },
  });

  if (!conversation?.agent || !conversation.agent.isActive) return;

  const agent = conversation.agent;

  const globalPrompts = await prisma.prompt.findMany({
    where: {
      companyId: conversation.companyId,
      agentId: null,
      isActive: true,
    },
    select: { title: true, content: true },
  });

  const allPrompts = [...agent.prompts, ...globalPrompts];
  const systemPrompt = composeSystemPrompt(agent.systemPrompt, allPrompts);

  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { sender: true, content: true },
  });

  const messages = buildMessages(recentMessages);
  if (messages.length === 0) return;

  const useThinking = supportsThinking(agent.model);

  const response = await client.messages.create({
    model: agent.model,
    max_tokens: agent.maxTokens,
    system: systemPrompt,
    messages,
    ...(useThinking
      ? { thinking: { type: "adaptive" as const } }
      : { temperature: agent.temperature }),
  });

  let responseText = "";
  for (const block of response.content) {
    if (block.type === "text") {
      responseText += block.text;
    }
  }

  if (!responseText) return;

  await prisma.message.create({
    data: {
      conversationId,
      companyId: conversation.companyId,
      sender: "AI",
      type: "TEXT",
      content: responseText,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      status: "AI_HANDLING",
    },
  });

  await sendTextMessage(
    conversation.whatsappInstance.instanceName,
    conversation.contactPhone,
    responseText
  );
}
