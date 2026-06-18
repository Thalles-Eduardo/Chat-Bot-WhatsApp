import { z } from "zod";

export const agentSchema = z.object({
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres").max(100),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(10, "System prompt deve ter no minimo 10 caracteres"),
  model: z.string().default("claude-opus-4-8"),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  maxTokens: z.coerce.number().min(100).max(16000).default(1000),
});

export const promptSchema = z.object({
  title: z.string().min(2, "Titulo deve ter no minimo 2 caracteres").max(200),
  content: z.string().min(10, "Conteudo deve ter no minimo 10 caracteres"),
  agentId: z.string().uuid().optional().or(z.literal("")),
});

export type AgentInput = z.infer<typeof agentSchema>;
export type PromptInput = z.infer<typeof promptSchema>;
