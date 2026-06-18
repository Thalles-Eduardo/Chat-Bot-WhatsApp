"use client";

import { useState, useTransition } from "react";
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
import { createAgent, updateAgent } from "@/actions/agents";

const MODELS = [
  { value: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
];

interface AgentData {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface AgentFormDialogProps {
  mode: "create" | "edit";
  agent?: AgentData;
  trigger?: React.ReactNode;
}

export function AgentFormDialog({ mode, agent, trigger }: AgentFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [name, setName] = useState(agent?.name ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt ?? "");
  const [model, setModel] = useState(agent?.model ?? "claude-opus-4-8");
  const [temperature, setTemperature] = useState(
    String(agent?.temperature ?? 0.7)
  );
  const [maxTokens, setMaxTokens] = useState(String(agent?.maxTokens ?? 1000));

  function resetForm() {
    if (mode === "create") {
      setName("");
      setDescription("");
      setSystemPrompt("");
      setModel("claude-opus-4-8");
      setTemperature("0.7");
      setMaxTokens("1000");
    }
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const data = {
      name,
      description: description || undefined,
      systemPrompt,
      model,
      temperature: parseFloat(temperature),
      maxTokens: parseInt(maxTokens, 10),
    };

    startTransition(async () => {
      const result =
        mode === "edit" && agent
          ? await updateAgent(agent.id, data)
          : await createAgent(data);

      if (!result.success) {
        setError(result.error ?? "Erro ao salvar agente");
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
                Novo agente
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
            {mode === "create" ? "Novo agente" : "Editar agente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Nome</Label>
            <Input
              id="agent-name"
              placeholder="Atendente de vendas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-description">Descricao (opcional)</Label>
            <Input
              id="agent-description"
              placeholder="Agente especializado em vendas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-prompt">System Prompt</Label>
            <textarea
              id="agent-prompt"
              placeholder="Voce e um assistente de atendimento ao cliente..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={isPending}
              rows={5}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="agent-model">Modelo</Label>
              <select
                id="agent-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={isPending}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-temp">Temperatura</Label>
              <Input
                id="agent-temp"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-tokens">Max Tokens</Label>
              <Input
                id="agent-tokens"
                type="number"
                step="100"
                min="100"
                max="16000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? "Salvando..."
              : mode === "create"
                ? "Criar agente"
                : "Salvar alteracoes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
