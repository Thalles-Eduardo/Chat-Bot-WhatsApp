"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sendMessage } from "@/actions/conversations";

interface ChatInputProps {
  conversationId: string;
  disabled?: boolean;
}

export function ChatInput({ conversationId, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await sendMessage(conversationId, trimmed);
      if (result.success) {
        setText("");
        router.refresh();
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }

  return (
    <div className="flex items-end gap-2 border-t bg-background p-4">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Digite uma mensagem..."
        disabled={disabled || isPending}
        rows={1}
        className="flex-1 resize-none rounded-lg border bg-muted/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring disabled:opacity-50"
      />
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={disabled || isPending || !text.trim()}
        title="Enviar"
      >
        <Send className="size-4" />
      </Button>
    </div>
  );
}
