"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentFormDialog } from "@/components/sections/agent-form-dialog";
import { toggleAgent, deleteAgent } from "@/actions/agents";

interface AgentActionsProps {
  agent: {
    id: string;
    name: string;
    description: string | null;
    systemPrompt: string;
    model: string;
    temperature: number;
    maxTokens: number;
    isActive: boolean;
  };
}

export function AgentActions({ agent }: AgentActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      await toggleAgent(agent.id);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteAgent(agent.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <AgentFormDialog
        mode="edit"
        agent={agent}
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
        title={agent.isActive ? "Desativar" : "Ativar"}
      >
        <Power
          className={`size-4 ${agent.isActive ? "text-green-500" : "text-muted-foreground"}`}
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
