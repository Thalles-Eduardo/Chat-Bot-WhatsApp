"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Unplug, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QRCodeDialog } from "@/components/sections/qr-code-dialog";
import {
  connectInstance,
  disconnectInstance,
  deleteInstance,
} from "@/actions/whatsapp";

interface InstanceActionsProps {
  instanceId: string;
  status: string;
}

export function InstanceActions({ instanceId, status }: InstanceActionsProps) {
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConnect() {
    startTransition(async () => {
      const result = await connectInstance(instanceId);
      if (result.success) {
        setQrDialogOpen(true);
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectInstance(instanceId);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteInstance(instanceId);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {status !== "CONNECTED" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleConnect}
            disabled={isPending}
            title="Conectar"
          >
            <QrCode className="size-4" />
          </Button>
        )}
        {status === "CONNECTED" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDisconnect}
            disabled={isPending}
            title="Desconectar"
          >
            <Unplug className="size-4" />
          </Button>
        )}
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
      <QRCodeDialog
        instanceId={instanceId}
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
      />
    </>
  );
}
