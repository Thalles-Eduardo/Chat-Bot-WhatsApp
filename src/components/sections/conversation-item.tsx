"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ConversationItemProps {
  id: string;
  contactName: string;
  contactPhone: string;
  status: string;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  lastMessageSender: string | null;
  isSelected: boolean;
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-yellow-500",
  IN_PROGRESS: "bg-green-500",
  CLOSED: "bg-muted-foreground/50",
};

export function ConversationItem({
  id,
  contactName,
  contactPhone,
  status,
  lastMessageAt,
  lastMessagePreview,
  lastMessageSender,
  isSelected,
}: ConversationItemProps) {
  const initials = contactName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const prefix =
    lastMessageSender === "OPERATOR"
      ? "Voce: "
      : lastMessageSender === "AI"
        ? "IA: "
        : "";

  return (
    <Link
      href={`/dashboard/conversas?id=${id}`}
      className={`flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50 ${
        isSelected ? "bg-muted" : ""
      }`}
    >
      <Avatar className="size-10 shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium">{contactName}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {formatRelativeTime(lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[status] ?? STATUS_DOT.CLOSED}`} />
          <p className="truncate text-xs text-muted-foreground">
            {lastMessagePreview ? `${prefix}${lastMessagePreview}` : contactPhone}
          </p>
        </div>
      </div>
    </Link>
  );
}
