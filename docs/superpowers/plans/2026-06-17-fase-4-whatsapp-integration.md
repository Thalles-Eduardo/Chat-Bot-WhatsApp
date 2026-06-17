# Fase 4 — WhatsApp Integration (Evolution API) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the platform to WhatsApp via Evolution API — CRUD instances, display QR codes, receive messages via webhook, and manage connection status.

**Architecture:** A centralized `evolution.ts` service wraps all HTTP calls to the Evolution API. Server Actions handle instance CRUD with auth/role checks and subscription limits. A public webhook route handler receives inbound messages and connection status events, storing them in the database. A dashboard page lets users manage instances and scan QR codes.

**Tech Stack:** Evolution API (REST), Prisma (existing schema), Zod v4, Shadcn/UI (dialog, table, badge), Next.js 16 Server Actions + Route Handlers

**Spec:** `docs/superpowers/specs/2026-06-17-fase-4-whatsapp-integration.md`

---

## File Map

### Created

| File | Purpose |
|------|---------|
| `src/services/evolution.ts` | HTTP client wrapping Evolution API endpoints |
| `src/validators/whatsapp.ts` | Zod schemas for instance creation and message sending |
| `src/actions/whatsapp.ts` | Server Actions: CRUD instances, get QR code |
| `src/app/api/webhooks/evolution/route.ts` | Webhook handler for inbound messages + connection status |
| `src/app/(dashboard)/dashboard/instancias/page.tsx` | Instances list page (Server Component) |
| `src/components/sections/create-instance-dialog.tsx` | Dialog to create new instance |
| `src/components/sections/qr-code-dialog.tsx` | Dialog showing QR code with polling |
| `src/components/sections/instance-actions.tsx` | Action buttons per instance row |

### Modified

| File | Change |
|------|--------|
| `src/proxy.ts` | Add `/api/webhooks` to public routes |
| `src/lib/auth/constants.ts` | Add `WEBHOOKS_API_PREFIX` constant |

### Auto-generated (Shadcn)

| File | Source |
|------|--------|
| `src/components/ui/dialog.tsx` | `npx shadcn add dialog` |
| `src/components/ui/table.tsx` | `npx shadcn add table` |
| `src/components/ui/badge.tsx` | `npx shadcn add badge` |

---

### Task 1: Install Shadcn components + update proxy for webhooks

**Files:**
- Auto-generated: `src/components/ui/dialog.tsx`, `src/components/ui/table.tsx`, `src/components/ui/badge.tsx`
- Modify: `src/lib/auth/constants.ts`
- Modify: `src/proxy.ts`

- [ ] **Step 1: Install dialog, table, badge**

```bash
npx shadcn add dialog table badge --yes
```

- [ ] **Step 2: Add webhooks constant to `src/lib/auth/constants.ts`**

Add this line after the `AUTH_API_PREFIX` line:

```typescript
export const WEBHOOKS_API_PREFIX = "/api/webhooks";
```

- [ ] **Step 3: Update `src/proxy.ts` to exclude webhooks from auth**

Add import of `WEBHOOKS_API_PREFIX` and add this block right after the `AUTH_API_PREFIX` check (after line 29):

```typescript
if (pathname.startsWith(WEBHOOKS_API_PREFIX)) {
  return NextResponse.next();
}
```

Updated import line:

```typescript
import {
  ACCESS_TOKEN_COOKIE,
  PUBLIC_ROUTES,
  AUTH_API_PREFIX,
  WEBHOOKS_API_PREFIX,
} from "@/lib/auth/constants";
```

- [ ] **Step 4: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/table.tsx src/components/ui/badge.tsx src/lib/auth/constants.ts src/proxy.ts
git commit -m "feat: install dialog/table/badge, exclude webhooks from proxy auth"
```

---

### Task 2: Evolution API service

**Files:**
- Create: `src/services/evolution.ts`

- [ ] **Step 1: Create `src/services/evolution.ts`**

```typescript
const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;

async function evolutionFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!BASE_URL || !API_KEY) {
    throw new Error("EVOLUTION_API_URL and EVOLUTION_API_KEY must be set");
  }

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Evolution API error (${response.status}): ${body}`);
  }

  if (response.status === 204) return {} as T;

  return response.json() as Promise<T>;
}

interface CreateInstanceResponse {
  instance: { instanceName: string; status: string };
  hash: string;
  qrcode?: { base64: string };
}

export async function createInstance(
  instanceName: string,
  webhookUrl: string
): Promise<CreateInstanceResponse> {
  return evolutionFetch<CreateInstanceResponse>("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      webhook: {
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      },
    }),
  });
}

export async function deleteInstance(instanceName: string): Promise<void> {
  await evolutionFetch(`/instance/delete/${instanceName}`, {
    method: "DELETE",
  });
}

interface ConnectionStateResponse {
  instance: { state: string };
}

export async function getInstanceStatus(
  instanceName: string
): Promise<{ state: string }> {
  const data = await evolutionFetch<ConnectionStateResponse>(
    `/instance/connectionState/${instanceName}`
  );
  return { state: data.instance.state };
}

interface QRCodeResponse {
  base64: string;
  pairingCode?: string;
}

export async function getQRCode(
  instanceName: string
): Promise<QRCodeResponse> {
  return evolutionFetch<QRCodeResponse>(
    `/instance/connect/${instanceName}`
  );
}

interface SendMessageResponse {
  key: { id: string };
}

export async function sendTextMessage(
  instanceName: string,
  phone: string,
  text: string
): Promise<SendMessageResponse> {
  return evolutionFetch<SendMessageResponse>(
    `/message/sendText/${instanceName}`,
    {
      method: "POST",
      body: JSON.stringify({
        number: phone,
        text,
      }),
    }
  );
}

export async function logoutInstance(instanceName: string): Promise<void> {
  await evolutionFetch(`/instance/logout/${instanceName}`, {
    method: "DELETE",
  });
}
```

- [ ] **Step 2: Delete `src/services/.gitkeep` if it exists**

```bash
rm src/services/.gitkeep 2>/dev/null; true
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 4: Commit**

```bash
git add src/services/
git commit -m "feat: add Evolution API service client"
```

---

### Task 3: Validators + Server Actions

**Files:**
- Create: `src/validators/whatsapp.ts`
- Create: `src/actions/whatsapp.ts`

- [ ] **Step 1: Create `src/validators/whatsapp.ts`**

```typescript
import { z } from "zod";

export const createInstanceSchema = z.object({
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
});

export const sendMessageSchema = z.object({
  phone: z.string().min(10, "Telefone invalido"),
  text: z.string().min(1, "Mensagem nao pode ser vazia"),
});

export type CreateInstanceInput = z.infer<typeof createInstanceSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
```

- [ ] **Step 2: Delete `src/validators/.gitkeep` if it exists**

```bash
rm src/validators/.gitkeep 2>/dev/null; true
```

- [ ] **Step 3: Create `src/actions/whatsapp.ts`**

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import { createInstanceSchema } from "@/validators/whatsapp";
import * as evolution from "@/services/evolution";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ActionResult {
  success: boolean;
  error?: string;
}

interface QRCodeResult extends ActionResult {
  qrCode?: string;
}

interface InstanceResult extends ActionResult {
  instanceId?: string;
}

export async function getInstances() {
  const user = await requireAuth();
  return prisma.whatsappInstance.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInstance(
  input: unknown
): Promise<InstanceResult> {
  const user = await requireRole("ADMIN");

  const parsed = createInstanceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name } = parsed.data;

  const subscription = await prisma.subscription.findUnique({
    where: { companyId: user.companyId },
  });

  if (!subscription) {
    return { success: false, error: "Subscription nao encontrada" };
  }

  const instanceCount = await prisma.whatsappInstance.count({
    where: { companyId: user.companyId },
  });

  if (instanceCount >= subscription.maxInstances) {
    return {
      success: false,
      error: `Limite de ${subscription.maxInstances} instancia(s) atingido`,
    };
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { slug: true },
  });

  const instanceName = `${company?.slug}-${generateSlug(name)}`;

  const existing = await prisma.whatsappInstance.findUnique({
    where: {
      companyId_instanceName: {
        companyId: user.companyId,
        instanceName,
      },
    },
  });

  if (existing) {
    return { success: false, error: "Ja existe uma instancia com esse nome" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhooks/evolution`;

  try {
    await evolution.createInstance(instanceName, webhookUrl);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar instancia";
    return { success: false, error: message };
  }

  const instance = await prisma.whatsappInstance.create({
    data: {
      companyId: user.companyId,
      name,
      instanceName,
      status: "CONNECTING",
    },
  });

  return { success: true, instanceId: instance.id };
}

export async function deleteInstance(
  instanceId: string
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const instance = await prisma.whatsappInstance.findFirst({
    where: { id: instanceId, companyId: user.companyId },
  });

  if (!instance) {
    return { success: false, error: "Instancia nao encontrada" };
  }

  try {
    await evolution.deleteInstance(instance.instanceName);
  } catch {
    // Instance may already be deleted on Evolution side
  }

  await prisma.whatsappInstance.delete({ where: { id: instanceId } });

  return { success: true };
}

export async function connectInstance(
  instanceId: string
): Promise<QRCodeResult> {
  const user = await requireAuth();

  const instance = await prisma.whatsappInstance.findFirst({
    where: { id: instanceId, companyId: user.companyId },
  });

  if (!instance) {
    return { success: false, error: "Instancia nao encontrada" };
  }

  try {
    const qr = await evolution.getQRCode(instance.instanceName);

    await prisma.whatsappInstance.update({
      where: { id: instanceId },
      data: { status: "CONNECTING" },
    });

    return { success: true, qrCode: qr.base64 };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao obter QR code";
    return { success: false, error: message };
  }
}

export async function disconnectInstance(
  instanceId: string
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  const instance = await prisma.whatsappInstance.findFirst({
    where: { id: instanceId, companyId: user.companyId },
  });

  if (!instance) {
    return { success: false, error: "Instancia nao encontrada" };
  }

  try {
    await evolution.logoutInstance(instance.instanceName);
  } catch {
    // May already be disconnected
  }

  await prisma.whatsappInstance.update({
    where: { id: instanceId },
    data: { status: "DISCONNECTED", phone: null },
  });

  return { success: true };
}

export async function getInstanceQRCode(
  instanceId: string
): Promise<QRCodeResult> {
  const user = await requireAuth();

  const instance = await prisma.whatsappInstance.findFirst({
    where: { id: instanceId, companyId: user.companyId },
  });

  if (!instance) {
    return { success: false, error: "Instancia nao encontrada" };
  }

  if (instance.status === "CONNECTED") {
    return { success: true, qrCode: undefined };
  }

  try {
    const qr = await evolution.getQRCode(instance.instanceName);
    return { success: true, qrCode: qr.base64 };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao obter QR code";
    return { success: false, error: message };
  }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 5: Commit**

```bash
git add src/validators/whatsapp.ts src/actions/whatsapp.ts src/validators/.gitkeep
git commit -m "feat: add WhatsApp validators and server actions for instance CRUD"
```

---

### Task 4: Webhook route handler

**Files:**
- Create: `src/app/api/webhooks/evolution/route.ts`

- [ ] **Step 1: Create `src/app/api/webhooks/evolution/route.ts`**

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUS_MAP: Record<string, "CONNECTED" | "DISCONNECTED" | "CONNECTING"> =
  {
    open: "CONNECTED",
    close: "DISCONNECTED",
    connecting: "CONNECTING",
  };

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("apikey");

  if (!apiKey || apiKey !== process.env.EVOLUTION_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { event, instance: instanceName } = body;

  if (!event || !instanceName) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const whatsappInstance = await prisma.whatsappInstance.findFirst({
    where: { instanceName },
  });

  if (!whatsappInstance) {
    return NextResponse.json({ error: "Instance not found" }, { status: 404 });
  }

  if (event === "messages.upsert") {
    await handleMessageUpsert(body, whatsappInstance);
  } else if (event === "connection.update") {
    await handleConnectionUpdate(body, whatsappInstance);
  }

  return NextResponse.json({ received: true });
}

async function handleMessageUpsert(
  body: {
    data: {
      key: { remoteJid: string; fromMe: boolean; id: string };
      message?: {
        conversation?: string;
        extendedTextMessage?: { text: string };
      };
      pushName?: string;
    };
  },
  whatsappInstance: { id: string; companyId: string }
) {
  const { key, message, pushName } = body.data;

  if (key.fromMe) return;

  const contactPhone = key.remoteJid.replace("@s.whatsapp.net", "");
  const contactName = pushName || contactPhone;
  const content =
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    "";

  if (!content) return;

  let conversation = await prisma.conversation.findFirst({
    where: {
      whatsappInstanceId: whatsappInstance.id,
      contactPhone,
      status: { not: "CLOSED" },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        companyId: whatsappInstance.companyId,
        whatsappInstanceId: whatsappInstance.id,
        contactName,
        contactPhone,
        status: "PENDING",
      },
    });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      companyId: whatsappInstance.companyId,
      sender: "CONTACT",
      type: "TEXT",
      content,
      whatsappMessageId: key.id,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      contactName,
    },
  });
}

async function handleConnectionUpdate(
  body: { data: { state: string } },
  whatsappInstance: { id: string; instanceName?: string }
) {
  const { state } = body.data;
  const status = STATUS_MAP[state];

  if (!status) return;

  await prisma.whatsappInstance.update({
    where: { id: whatsappInstance.id },
    data: { status },
  });
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build passes. `/api/webhooks/evolution` appears as dynamic route.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/
git commit -m "feat: add Evolution API webhook handler for messages and connection status"
```

---

### Task 5: Instances page + CreateInstanceDialog

**Files:**
- Create: `src/app/(dashboard)/dashboard/instancias/page.tsx`
- Create: `src/components/sections/create-instance-dialog.tsx`

- [ ] **Step 1: Create `src/components/sections/create-instance-dialog.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInstance } from "@/actions/whatsapp";

export function CreateInstanceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createInstance({ name });
      if (!result.success) {
        setError(result.error ?? "Erro ao criar instancia");
        return;
      }
      setName("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Nova instancia
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova instancia WhatsApp</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instance-name">Nome da instancia</Label>
            <Input
              id="instance-name"
              placeholder="Atendimento principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Criando..." : "Criar instancia"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Note on Dialog API:** Shadcn base-nova uses `@base-ui/react` under the hood. The `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` components may use `render` prop instead of `asChild`. If `DialogTrigger` does not accept `render`, use it as a wrapper around a plain button element: `<DialogTrigger><Button><Plus /> Nova instancia</Button></DialogTrigger>`. Check the generated `dialog.tsx` file and adapt accordingly — the pattern matches what was done in Fase 3 with `SidebarMenuButton`.

- [ ] **Step 2: Create `src/app/(dashboard)/dashboard/instancias/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getInstances } from "@/actions/whatsapp";
import { CreateInstanceDialog } from "@/components/sections/create-instance-dialog";
import { InstanceActions } from "@/components/sections/instance-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Instancias — IA WhatsApp",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CONNECTED: { label: "Conectado", variant: "default" },
  CONNECTING: { label: "Conectando", variant: "secondary" },
  DISCONNECTED: { label: "Desconectado", variant: "outline" },
};

export default async function InstanciasPage() {
  const instances = await getInstances();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Instancias WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas conexoes WhatsApp
          </p>
        </div>
        <CreateInstanceDialog />
      </div>

      {instances.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma instancia criada. Clique em "Nova instancia" para comecar.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((instance) => {
                const statusConfig =
                  STATUS_CONFIG[instance.status] || STATUS_CONFIG.DISCONNECTED;
                return (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">
                      {instance.name}
                    </TableCell>
                    <TableCell>
                      {instance.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <InstanceActions
                        instanceId={instance.id}
                        status={instance.status}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build will fail because `InstanceActions` component doesn't exist yet. That's OK — it's created in Task 6. If you want to verify incrementally, temporarily replace `<InstanceActions ... />` with `<span>—</span>`, build, then revert.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/create-instance-dialog.tsx src/app/\(dashboard\)/dashboard/instancias/
git commit -m "feat: add instances page and create instance dialog"
```

---

### Task 6: InstanceActions + QRCodeDialog

**Files:**
- Create: `src/components/sections/instance-actions.tsx`
- Create: `src/components/sections/qr-code-dialog.tsx`

- [ ] **Step 1: Create `src/components/sections/qr-code-dialog.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `src/components/sections/instance-actions.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build passes with all routes including `/dashboard/instancias`.

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/qr-code-dialog.tsx src/components/sections/instance-actions.tsx
git commit -m "feat: add QR code dialog and instance action buttons"
```

---

### Task 7: Final build verification + cleanup

**Files:**
- Delete: `src/whatsapp/.gitkeep` (the `src/services/` dir is now used instead)

- [ ] **Step 1: Clean up leftover .gitkeep**

```bash
rm src/whatsapp/.gitkeep 2>/dev/null; true
```

- [ ] **Step 2: Verify full build**

Run: `npm run build`

Expected: Build passes with all routes:
- `/` (redirect)
- `/login` and `/register` (auth pages)
- `/dashboard` (dashboard page)
- `/dashboard/instancias` (instances page)
- `/api/auth/refresh` (API route)
- `/api/webhooks/evolution` (webhook handler)

- [ ] **Step 3: Start dev server and verify**

Run: `npm run dev`

Test:
1. Visit `/dashboard/instancias` — page renders with empty state ("Nenhuma instancia criada")
2. Click "Nova instancia" — dialog opens with name input
3. Table renders correctly with columns: Nome, Telefone, Status, Acoes

- [ ] **Step 4: Commit cleanup if needed**

```bash
git add -A
git commit -m "chore: clean up gitkeep files, finalize Fase 4"
```

---

## Final Verification

After all 7 tasks, confirm:

- [ ] `npm run build` — passes with no errors
- [ ] `/dashboard/instancias` — renders instances page with create dialog
- [ ] Server Action `createInstance` validates input, checks subscription limits, calls Evolution API
- [ ] Server Action `deleteInstance` removes from Evolution + Prisma
- [ ] `connectInstance` returns QR code base64
- [ ] `POST /api/webhooks/evolution` is accessible without JWT
- [ ] Webhook `messages.upsert` creates Conversation + Message in database
- [ ] Webhook `connection.update` updates instance status
- [ ] QR code dialog shows image and polls every 5 seconds
- [ ] All instances are isolated by company (multi-tenant)
