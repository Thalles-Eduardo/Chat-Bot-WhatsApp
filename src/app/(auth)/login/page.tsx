import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/sections/auth-form";

export const metadata: Metadata = {
  title: "Entrar — IA WhatsApp",
};

export default function LoginPage() {
  return (
    <>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Entrar</h2>
        <p className="text-sm text-muted-foreground">
          Digite suas credenciais para acessar o painel
        </p>
      </div>

      <AuthForm mode="login" submitLabel="Entrar" />

      <p className="text-center text-sm text-muted-foreground">
        Nao tem conta?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Registre-se
        </Link>
      </p>
    </>
  );
}
