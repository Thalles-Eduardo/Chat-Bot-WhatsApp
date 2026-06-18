"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MessageBubble } from "@/components/sections/message-bubble";
import { ChatInput } from "@/components/sections/chat-input";
import { ConversationStatusActions } from "@/components/sections/conversation-status-actions";
import { getMessages } from "@/actions/conversations";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  PENDING: { label: "Pendente", variant: "secondary" },
  IN_PROGRESS: { label: "Em atendimento", variant: "default" },
  CLOSED: { label: "Fechada", variant: "outline" },
};

interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: Date;
}

interface ChatViewProps {
  conversation: {
    id: string;
    contactName: string;
    contactPhone: string;
    status: string;
  };
  initialMessages: Message[];
}

export function ChatView({ conversation, initialMessages }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const fetchMessages = useCallback(async () => {
    const updated = await getMessages(conversation.id);
    if (updated.length !== messages.length) {
      setMessages(updated);
    }
  }, [conversation.id, messages.length]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const statusConfig = STATUS_LABELS[conversation.status] ?? STATUS_LABELS.PENDING;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="font-semibold">{conversation.contactName}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="size-3" />
            {conversation.contactPhone}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          <ConversationStatusActions
            conversationId={conversation.id}
            status={conversation.status}
          />
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              sender={msg.sender}
              createdAt={msg.createdAt}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        conversationId={conversation.id}
        disabled={conversation.status === "CLOSED"}
      />
    </div>
  );
}
