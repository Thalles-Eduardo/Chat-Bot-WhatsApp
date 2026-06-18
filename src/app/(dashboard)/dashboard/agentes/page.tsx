import type { Metadata } from "next";
import { getAgents } from "@/actions/agents";
import { AgentFormDialog } from "@/components/sections/agent-form-dialog";
import { AgentActions } from "@/components/sections/agent-actions";
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
  title: "Agentes — IA WhatsApp",
};

export default async function AgentesPage() {
  const agents = await getAgents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agentes IA</h1>
          <p className="text-muted-foreground">
            Gerencie seus agentes de atendimento automatico
          </p>
        </div>
        <AgentFormDialog mode="create" />
      </div>

      {agents.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Nenhum agente criado. Clique em &quot;Novo agente&quot; para
            comecar.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Conversas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{agent.model}</code>
                  </TableCell>
                  <TableCell>{agent._count.conversations}</TableCell>
                  <TableCell>
                    <Badge variant={agent.isActive ? "default" : "outline"}>
                      {agent.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AgentActions
                      agent={{
                        id: agent.id,
                        name: agent.name,
                        description: agent.description,
                        systemPrompt: agent.systemPrompt,
                        model: agent.model,
                        temperature: agent.temperature,
                        maxTokens: agent.maxTokens,
                        isActive: agent.isActive,
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
