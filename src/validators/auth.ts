import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email invalido"),
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
});

export const registerSchema = z.object({
  companyName: z
    .string()
    .min(2, "Nome da empresa deve ter no minimo 2 caracteres"),
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
  email: z.email("Email invalido"),
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
