# Fase 5 — Conversations UI / Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an inbox-style conversations page where operators can view WhatsApp conversations and send text replies.

**Architecture:** Server Component page fetches conversations and messages. Client Components handle interactivity: conversation list with filters/search, chat view with message bubbles and send input, polling for updates. Conversation selection via URL search params (`?id=xxx`). The page negates the dashboard layout padding to fill the viewport.

**Tech Stack:** Next.js 16 Server Components + Client Components, Prisma, Evolution API service (existing), Shadcn/UI (existing components), Lucide React icons

**Spec:** `docs/superpowers/specs/2026-06-18-fase-5-conversations-ui.md`

---

## File Map

### Created

| File | Purpose |
|------|---------|
| `src/actions/conversations.ts` | Server Actions for conversations: list, messages, send, status, assign |
| `src/app/(dashboard)/dashboard/conversas/page.tsx` | Inbox page (Server Component) |
| `src/components/sections/conversation-list.tsx` | Sidebar conversation list with filters and search |
| `src/components/sections/conversation-item.tsx` | Single conversation row in list |
| `src/components/sections/chat-view.tsx` | Chat panel with messages and input |
| `src/components/sections/message-bubble.tsx` | Individual message bubble |
| `src/components/sections/chat-input.tsx` | Text input + send button |
| `src/components/sections/conversation-status-actions.tsx` | Status change dropdown in chat header |

### No existing files modified

---

### Task 1: Server Actions for conversations

**Files:**
- Create: `src/actions/conversations.ts`

- [ ] **Step 1: Create `src/actions/conversations.ts`**

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import * as evolution from "@/services/evolution";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getConversations(status?: string) {
  const user = await requireAuth();

  const where: Record<string, unknown> = { companyId: user.companyId };
  if (status && status !== "ALL") {
    where.status = status;
  }

  return prisma.conversation.findMany({
    where,
    include: {
      whatsappInstance: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, sender: true },
      },
    },
    orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
  });
}

export async function getMessages(conversationId: string) {
  const user = await requireAuth();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, companyId: user.companyId },
  });

  if (!conversation) {
    return [];
  }

  await prisma.message.updateMany({
    where: {
      conversationId,
      sender: "CONTACT",
      isRead: false,
    },
    data: { isRead: true },
  });

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<ActionResult> {
  const user = await requireAuth();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, companyId: user.companyId },
    include: { whatsappInstance: true },
  });

  if (!conversation) {
    return { success: false, error: "Conversa nao encontrada" };
  }

  if (conversation.status === "CLOSED") {
    return { success: false, error: "Conversa fechada" };
  }

  try {
    await evolution.sendTextMessage(
      conversation.whatsappInstance.instanceName,
      conversation.contactPhone,
      text
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao enviar mensagem";
    return { success: false, error: message };
  }

  await prisma.message.create({
    data: {
      conversationId,
      companyId: user.companyId,
      sender: "OPERATOR",
      type: "TEXT",
      content: text,
    },
  });

  const updates: Record<string, unknown> = {
    lastMessageAt: new Date(),
  };
  if (conversation.status === "PENDING") {
    updates.status = "IN_PROGRESS";
  }
  if (!conversation.operatorId) {
    updates.operatorId = user.userId;
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: updates,
  });

  return { success: true };
}

export async function updateConversationStatus(
  conversationId: string,
  status: string
): Promise<ActionResult> {
  const user = await requireAuth();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, companyId: user.companyId },
  });

  if (!conversation) {
    return { success: false, error: "Conversa nao encontrada" };
  }

  const validStatuses = ["PENDING", "IN_PROGRESS", "CLOSED"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Status invalido" };
  }

  const data: Record<string, unknown> = { status };
  if (status === "CLOSED") {
    data.closedAt = new Date();
  }
  if (status === "PENDING") {
    data.closedAt = null;
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data,
  });

  return { success: true };
}

export async function assignOperator(
  conversationId: string,
  operatorId: string | null
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, companyId: user.companyId },
  });

  if (!conversation) {
    return { success: false, error: "Conversa nao encontrada" };
  }

  if (operatorId) {
    const operator = await prisma.user.findFirst({
      where: { id: operatorId, companyId: user.companyId },
    });
    if (!operator) {
      return { success: false, error: "Operador nao encontrado" };
    }
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { operatorId },
  });

  return { success: true };
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/actions/conversations.ts
git commit -m "feat: add server actions for conversations and messages"
```

---

### Task 2: MessageBubble component

**Files:**
- Create: `src/components/sections/message-bubble.tsx`

- [ ] **Step 1: Create `src/components/sections/message-bubble.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/message-bubble.tsx
git commit -m "feat: add message bubble component"
```

---

### Task 3: ChatInput component

**Files:**
- Create: `src/components/sections/chat-input.tsx`

- [ ] **Step 1: Create `src/components/sections/chat-input.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/chat-input.tsx
git commit -m "feat: add chat input component"
```

---

### Task 4: ConversationStatusActions component

**Files:**
- Create: `src/components/sections/conversation-status-actions.tsx`

- [ ] **Step 1: Create `src/components/sections/conversation-status-actions.tsx`**

```tsx
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
```

**Note on DropdownMenuTrigger:** This project uses Shadcn base-nova style. `DropdownMenuTrigger` uses the `render` prop pattern (same as `SidebarMenuButton` does in `app-sidebar.tsx`). Check `src/components/ui/dropdown-menu.tsx` to confirm. If `DropdownMenuTrigger` does NOT support `render`, wrap the button directly: `<DropdownMenuTrigger><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>`.

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/conversation-status-actions.tsx
git commit -m "feat: add conversation status actions dropdown"
```

---

### Task 5: ChatView component

**Files:**
- Create: `src/components/sections/chat-view.tsx`

- [ ] **Step 1: Create `src/components/sections/chat-view.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/chat-view.tsx
git commit -m "feat: add chat view component with polling and message display"
```

---

### Task 6: ConversationItem component

**Files:**
- Create: `src/components/sections/conversation-item.tsx`

- [ ] **Step 1: Create `src/components/sections/conversation-item.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/conversation-item.tsx
git commit -m "feat: add conversation item component"
```

---

### Task 7: ConversationList component

**Files:**
- Create: `src/components/sections/conversation-list.tsx`

- [ ] **Step 1: Create `src/components/sections/conversation-list.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/conversation-list.tsx
git commit -m "feat: add conversation list with filters and search"
```

---

### Task 8: Conversations page (Server Component)

**Files:**
- Create: `src/app/(dashboard)/dashboard/conversas/page.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/dashboard/conversas/page.tsx`**

```tsx
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
```

**IMPORTANT about `searchParams`:** In Next.js 16, `searchParams` in page components is a `Promise`. You must `await` it before accessing properties. This is a breaking change from earlier versions.

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build passes. Route `/dashboard/conversas` appears as dynamic.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/conversas/
git commit -m "feat: add conversations inbox page"
```

---

### Task 9: Final build verification + dev server test

- [ ] **Step 1: Verify full build**

Run: `npm run build`

Expected: Build passes with all routes:
- `/dashboard/conversas` (dynamic)
- `/dashboard/instancias` (dynamic)
- `/api/webhooks/evolution` (dynamic)
- All existing routes intact

- [ ] **Step 2: Start dev server and verify**

Run: `npm run dev`

Test:
1. Visit `/dashboard/conversas` — page renders with empty state ("Selecione uma conversa para comecar" on desktop, "Nenhuma conversa encontrada" in list)
2. Sidebar "Conversas" link is active on this page
3. Filter buttons (Todas, Pendentes, Em atendimento, Fechadas) render and are clickable
4. Search input renders with placeholder
5. On mobile viewport: only the list is visible when no conversation selected

- [ ] **Step 3: Commit cleanup if needed**

```bash
git add -A
git commit -m "chore: finalize Fase 5 conversations UI"
```

---

## Final Verification

After all 9 tasks, confirm:

- [ ] `npm run build` — passes with no errors
- [ ] `/dashboard/conversas` — renders inbox layout with list and empty state
- [ ] Selecting a conversation via `?id=xxx` shows ChatView with messages
- [ ] Sending a message calls Evolution API and saves with sender OPERATOR
- [ ] First reply auto-sets status to IN_PROGRESS and assigns operator
- [ ] Status actions dropdown: start/close/reopen work correctly
- [ ] Filter buttons filter conversations by status
- [ ] Search filters by name/phone client-side
- [ ] Mobile responsive: list OR chat shown, not both
- [ ] Polling updates messages (3s) and conversation list (5s)
- [ ] Message bubbles: CONTACT left, OPERATOR right, AI right with bot icon, SYSTEM centered
