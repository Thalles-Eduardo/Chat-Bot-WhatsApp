"use client";

import { Bot } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  sender: string;
  createdAt: Date;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ content, sender, createdAt }: MessageBubbleProps) {
  if (sender === "SYSTEM") {
    return (
      <div className="flex justify-center py-1">
        <p className="text-xs text-muted-foreground">{content}</p>
      </div>
    );
  }

  const isOutgoing = sender === "OPERATOR" || sender === "AI";

  return (
    <div
      className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isOutgoing
            ? sender === "AI"
              ? "bg-primary/80 text-primary-foreground"
              : "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {sender === "AI" && (
          <div className="mb-1 flex items-center gap-1">
            <Bot className="size-3" />
            <span className="text-xs opacity-70">IA</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <p
          className={`mt-1 text-right text-[10px] ${
            isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatTime(createdAt)}
        </p>
      </div>
    </div>
  );
}
