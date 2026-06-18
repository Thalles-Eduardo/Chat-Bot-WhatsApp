"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPrompt, updatePrompt } from "@/actions/prompts";
import { getActiveAgents } from "@/actions/agents";

interface PromptData {
  id: string;
  title: string;
  content: string;
  agentId: string | null;
}

interface PromptFormDialogProps {
  mode: "create" | "edit";
  prompt?: PromptData;
  trigger?: React.ReactElement;
}

export function PromptFormDialog({
  mode,
  prompt,
  trigger,
}: PromptFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();

  const [title, setTitle] = useState(prompt?.title ?? "");
  const [content, setContent] = useState(prompt?.content ?? "");
  const [agentId, setAgentId] = useState(prompt?.agentId ?? "");

  useEffect(() => {
    if (open) {
      getActiveAgents().then(setAgents);
    }
  }, [open]);

  function resetForm() {
    if (mode === "create") {
      setTitle("");
      setContent("");
      setAgentId("");
    }
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const data = {
      title,
      content,
      agentId: agentId || undefined,
    };

    startTransition(async () => {
      const result =
        mode === "edit" && prompt
          ? await updatePrompt(prompt.id, data)
          : await createPrompt(data);

      if (!result.success) {
        setError(result.error ?? "Erro ao salvar prompt");
        return;
      }

      resetForm();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger render={trigger ?? <Button />}>
        {!trigger && (
          <>
            {mode === "create" ? (
              <>
                <Plus className="size-4" />
                Novo prompt
              </>
            ) : (
              <>
                <Pencil className="size-4" />
                Editar
              </>
            )}
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo prompt" : "Editar prompt"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-title">Titulo</Label>
            <Input
              id="prompt-title"
              placeholder="Politica de trocas e devolucoes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-content">Conteudo</Label>
            <textarea
              id="prompt-content"
              placeholder="Descreva o conhecimento que o agente deve ter..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending}
              rows={8}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-agent">Agente (opcional)</Label>
            <select
              id="prompt-agent"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              disabled={isPending}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Global (todos os agentes)</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Prompts globais sao incluidos na base de conhecimento de todos os
              agentes da empresa.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? "Salvando..."
              : mode === "create"
                ? "Criar prompt"
                : "Salvar alteracoes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
