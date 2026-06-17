import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/sections/auth-form";

export const metadata: Metadata = {
  title: "Criar conta — IA WhatsApp",
};

export default function RegisterPage() {
  return (
    <>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Criar conta</h2>
        <p className="text-sm text-muted-foreground">
          Registre sua empresa para comecar a atender com IA
        </p>
      </div>

      <AuthForm mode="register" submitLabel="Criar conta" />

      <p className="text-center text-sm text-muted-foreground">
        Ja tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entre
        </Link>
      </p>
    </>
  );
}
