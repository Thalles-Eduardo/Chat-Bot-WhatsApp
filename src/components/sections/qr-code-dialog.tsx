"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInstanceQRCode } from "@/actions/whatsapp";

interface QRCodeDialogProps {
  instanceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodeDialog({
  instanceId,
  open,
  onOpenChange,
}: QRCodeDialogProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchQRCode = useCallback(async () => {
    const result = await getInstanceQRCode(instanceId);
    if (!result.success) {
      setError(result.error ?? "Erro ao obter QR code");
      return;
    }
    if (!result.qrCode) {
      onOpenChange(false);
      router.refresh();
      return;
    }
    setQrCode(result.qrCode);
  }, [instanceId, onOpenChange, router]);

  useEffect(() => {
    if (!open) {
      setQrCode(null);
      setError(null);
      return;
    }

    fetchQRCode();
    const interval = setInterval(fetchQRCode, 5000);
    return () => clearInterval(interval);
  }, [open, fetchQRCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : qrCode ? (
            <>
              <div className="rounded-lg border bg-white p-4">
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="QR Code WhatsApp"
                  className="size-64"
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Abra o WhatsApp no celular, va em Dispositivos conectados
                e escaneie o QR code acima.
              </p>
            </>
          ) : (
            <div className="flex size-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
