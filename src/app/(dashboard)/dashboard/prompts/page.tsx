import type { Metadata } from "next";
import { getPrompts } from "@/actions/prompts";
import { PromptFormDialog } from "@/components/sections/prompt-form-dialog";
import { PromptActions } from "@/components/sections/prompt-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Prompts — IA WhatsApp",
};

export default async function PromptsPage() {
  const prompts = await getPrompts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Prompts / Knowledge Base
          </h1>
          <p className="text-muted-foreground">
            Gerencie a base de conhecimento dos seus agentes
          </p>
        </div>
        <PromptFormDialog mode="create" />
      </div>

      {prompts.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Nenhum prompt criado. Clique em &quot;Novo prompt&quot; para
            comecar.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prompts.map((prompt) => (
                <TableRow key={prompt.id}>
                  <TableCell>
                    <p className="font-medium">{prompt.title}</p>
                    <p className="max-w-md truncate text-xs text-muted-foreground">
                      {prompt.content}
                    </p>
                  </TableCell>
                  <TableCell>
                    {prompt.agent?.name ?? (
                      <span className="text-muted-foreground">Global</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={prompt.isActive ? "default" : "outline"}>
                      {prompt.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PromptActions
                      prompt={{
                        id: prompt.id,
                        title: prompt.title,
                        content: prompt.content,
                        agentId: prompt.agentId,
                        isActive: prompt.isActive,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
