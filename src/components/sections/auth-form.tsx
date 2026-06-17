"use client";

import { useState, useTransition } from "react";
import { useForm, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { loginSchema, registerSchema } from "@/validators/auth";
import { login, register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  placeholder: string;
}

const FORM_CONFIGS = {
  login: {
    schema: loginSchema,
    action: login,
    fields: [
      { name: "email", label: "Email", type: "email", placeholder: "seu@email.com" },
      { name: "password", label: "Senha", type: "password", placeholder: "••••••" },
    ] as FieldConfig[],
  },
  register: {
    schema: registerSchema,
    action: register,
    fields: [
      { name: "companyName", label: "Nome da empresa", type: "text", placeholder: "Minha Empresa" },
      { name: "name", label: "Seu nome", type: "text", placeholder: "Joao Silva" },
      { name: "email", label: "Email", type: "email", placeholder: "seu@email.com" },
      { name: "password", label: "Senha", type: "password", placeholder: "••••••" },
    ] as FieldConfig[],
  },
};

interface AuthFormProps {
  mode: "login" | "register";
  submitLabel: string;
}

export function AuthForm({ mode, submitLabel }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const config = FORM_CONFIGS[mode];

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    resolver: zodResolver(config.schema) as unknown as Resolver<FieldValues>,
  });

  function onSubmit(data: FieldValues) {
    setError(null);
    startTransition(async () => {
      const result = await config.action(data);
      if (!result.success) {
        setError(result.error ?? "Erro desconhecido");
      }
    });
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {config.fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            type={field.type}
            placeholder={field.placeholder}
            disabled={isPending}
            {...registerField(field.name)}
          />
          {errors[field.name] && (
            <p className="text-sm text-destructive">
              {errors[field.name]?.message as string}
            </p>
          )}
        </div>
      ))}

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </motion.form>
  );
}
