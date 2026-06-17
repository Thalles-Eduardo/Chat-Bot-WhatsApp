"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/lib/auth/password";
import {
  signAccessToken,
  signRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} from "@/lib/auth/jwt";
import { loginSchema, registerSchema } from "@/validators/auth";

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

export async function register(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { companyName, name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { success: false, error: "Email ja cadastrado" };
  }

  const passwordHash = await hashPassword(password);
  const slug = generateSlug(companyName);

  const existingSlug = await prisma.company.findUnique({ where: { slug } });
  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      slug: finalSlug,
      email,
      users: {
        create: {
          name,
          email,
          passwordHash,
          role: "OWNER",
        },
      },
      subscription: {
        create: {
          plan: "FREE",
          status: "ACTIVE",
          maxInstances: 1,
          maxAgents: 1,
          maxMessagesPerMonth: 1000,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      },
    },
    include: { users: true },
  });

  const user = company.users[0];

  const accessToken = await signAccessToken({
    sub: user.id,
    companyId: company.id,
    role: user.role,
    email: user.email,
  });
  const refreshToken = await signRefreshToken(user.id);

  await setTokenCookies(accessToken, refreshToken);

  redirect("/dashboard");
}

export async function login(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) {
    return { success: false, error: "Credenciais invalidas" };
  }

  if (!user.isActive) {
    return { success: false, error: "Conta desativada" };
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    return { success: false, error: "Credenciais invalidas" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    companyId: user.companyId,
    role: user.role,
    email: user.email,
  });
  const refreshToken = await signRefreshToken(user.id);

  await setTokenCookies(accessToken, refreshToken);

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await clearTokenCookies();
  redirect("/login");
}
