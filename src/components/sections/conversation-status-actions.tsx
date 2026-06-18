"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Play, XCircle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateConversationStatus } from "@/actions/conversations";

interface ConversationStatusActionsProps {
  conversationId: string;
  status: string;
}

export function ConversationStatusActions({
  conversationId,
  status,
}: ConversationStatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await updateConversationStatus(conversationId, newStatus);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "PENDING" && (
          <DropdownMenuItem
            onSelect={() => handleStatusChange("IN_PROGRESS")}
            disabled={isPending}
          >
            <Play className="mr-2 size-4" />
            Iniciar atendimento
          </DropdownMenuItem>
        )}
        {(status === "PENDING" || status === "IN_PROGRESS") && (
          <DropdownMenuItem
            onSelect={() => handleStatusChange("CLOSED")}
            disabled={isPending}
          >
            <XCircle className="mr-2 size-4" />
            Fechar conversa
          </DropdownMenuItem>
        )}
        {status === "CLOSED" && (
          <DropdownMenuItem
            onSelect={() => handleStatusChange("PENDING")}
            disabled={isPending}
          >
            <RotateCcw className="mr-2 size-4" />
            Reabrir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
