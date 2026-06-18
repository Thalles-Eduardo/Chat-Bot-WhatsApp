import type { Metadata } from "next";
import { getInstances } from "@/actions/whatsapp";
import { CreateInstanceDialog } from "@/components/sections/create-instance-dialog";
import { InstanceActions } from "@/components/sections/instance-actions";
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
  title: "Instancias — IA WhatsApp",
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  CONNECTED: { label: "Conectado", variant: "default" },
  CONNECTING: { label: "Conectando", variant: "secondary" },
  DISCONNECTED: { label: "Desconectado", variant: "outline" },
};

export default async function InstanciasPage() {
  const instances = await getInstances();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Instancias WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas conexoes WhatsApp
          </p>
        </div>
        <CreateInstanceDialog />
      </div>

      {instances.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma instancia criada. Clique em &quot;Nova instancia&quot; para
            comecar.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((instance) => {
                const statusConfig =
                  STATUS_CONFIG[instance.status] ??
                  STATUS_CONFIG.DISCONNECTED;
                return (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">
                      {instance.name}
                    </TableCell>
                    <TableCell>{instance.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <InstanceActions
                        instanceId={instance.id}
                        status={instance.status}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
