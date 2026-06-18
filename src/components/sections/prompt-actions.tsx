"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PromptFormDialog } from "@/components/sections/prompt-form-dialog";
import { togglePrompt, deletePrompt } from "@/actions/prompts";

interface PromptActionsProps {
  prompt: {
    id: string;
    title: string;
    content: string;
    agentId: string | null;
    isActive: boolean;
  };
}

export function PromptActions({ prompt }: PromptActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      await togglePrompt(prompt.id);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePrompt(prompt.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <PromptFormDialog
        mode="edit"
        prompt={prompt}
        trigger={
          <Button variant="ghost" size="sm" disabled={isPending}>
            Editar
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={isPending}
        title={prompt.isActive ? "Desativar" : "Ativar"}
      >
        <Power
          className={`size-4 ${prompt.isActive ? "text-green-500" : "text-muted-foreground"}`}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        title="Excluir"
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}
