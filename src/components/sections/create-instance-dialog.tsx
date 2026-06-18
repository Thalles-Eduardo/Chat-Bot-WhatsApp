"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

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
import { createInstance } from "@/actions/whatsapp";

export function CreateInstanceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createInstance({ name });
      if (!result.success) {
        setError(result.error ?? "Erro ao criar instancia");
        return;
      }
      setName("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Nova instancia
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova instancia WhatsApp</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instance-name">Nome da instancia</Label>
            <Input
              id="instance-name"
              placeholder="Atendimento principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Criando..." : "Criar instancia"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
