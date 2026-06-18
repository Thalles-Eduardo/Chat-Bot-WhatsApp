import { z } from "zod";

export const createInstanceSchema = z.object({
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
});

export const sendMessageSchema = z.object({
  phone: z.string().min(10, "Telefone invalido"),
  text: z.string().min(1, "Mensagem nao pode ser vazia"),
});

export type CreateInstanceInput = z.infer<typeof createInstanceSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
