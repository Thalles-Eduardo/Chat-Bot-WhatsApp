"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConversationItem } from "@/components/sections/conversation-item";
import { getConversations } from "@/actions/conversations";

const STATUS_FILTERS = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendentes" },
  { value: "IN_PROGRESS", label: "Em atendimento" },
  { value: "CLOSED", label: "Fechadas" },
];

interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  status: string;
  lastMessageAt: Date | null;
  messages: { content: string; sender: string }[];
}

interface ConversationListProps {
  initialConversations: Conversation[];
  selectedId: string | null;
}

export function ConversationList({
  initialConversations,
  selectedId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  const fetchConversations = useCallback(async () => {
    const updated = await getConversations(statusFilter);
    setConversations(updated);
  }, [statusFilter]);

  useEffect(() => {
    fetchConversations();
  }, [statusFilter, fetchConversations]);

  useEffect(() => {
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.contactName.toLowerCase().includes(q) ||
      c.contactPhone.includes(q)
    );
  });

  return (
    <div
      className={`flex w-full flex-col border-r md:w-80 ${
        selectedId ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center gap-2">
          {selectedId && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => router.push("/dashboard/conversas")}
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <h2 className="text-lg font-semibold">Conversas</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma conversa encontrada
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              id={conv.id}
              contactName={conv.contactName}
              contactPhone={conv.contactPhone}
              status={conv.status}
              lastMessageAt={conv.lastMessageAt}
              lastMessagePreview={conv.messages[0]?.content ?? null}
              lastMessageSender={conv.messages[0]?.sender ?? null}
              isSelected={conv.id === selectedId}
            />
          ))
        )}
      </div>
    </div>
  );
}
