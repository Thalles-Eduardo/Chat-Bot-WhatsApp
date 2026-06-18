import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

import { getConversations, getMessages } from "@/actions/conversations";
import { ConversationList } from "@/components/sections/conversation-list";
import { ChatView } from "@/components/sections/chat-view";

export const metadata: Metadata = {
  title: "Conversas — IA WhatsApp",
};

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ConversasPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const conversations = await getConversations();

  let selectedConversation = null;
  let messages: Awaited<ReturnType<typeof getMessages>> = [];

  if (id) {
    selectedConversation =
      conversations.find((c) => c.id === id) ?? null;
    if (selectedConversation) {
      messages = await getMessages(id);
    }
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      <ConversationList
        initialConversations={conversations}
        selectedId={id ?? null}
      />

      {selectedConversation ? (
        <div className={`flex-1 ${id ? "flex" : "hidden md:flex"}`}>
          <ChatView
            conversation={{
              id: selectedConversation.id,
              contactName: selectedConversation.contactName,
              contactPhone: selectedConversation.contactPhone,
              status: selectedConversation.status,
            }}
            initialMessages={messages}
          />
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="mx-auto size-12 opacity-20" />
            <p className="mt-4">
              Selecione uma conversa para comecar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
