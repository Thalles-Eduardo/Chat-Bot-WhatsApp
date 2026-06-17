# Fase 3 — Design System & Auth UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the visual foundation: dark theme with red accent, auth pages (login/register), and the dashboard shell (sidebar + header layout).

**Architecture:** Shadcn/UI components with Tailwind v4 CSS variables for theming. Route groups `(auth)` and `(dashboard)` for distinct layouts. AuthForm is a reusable client component using React Hook Form + Zod. Dashboard uses Shadcn Sidebar with SidebarProvider pattern. Server Actions from Fase 2 are called from client forms via `useTransition`.

**Tech Stack:** Shadcn/UI (base-nova), Tailwind v4, React Hook Form, Zod v4, Framer Motion, Lucide React, next/font (Geist)

**Spec:** `docs/superpowers/specs/2026-06-17-fase-3-design-system.md`

---

## File Map

### Created

| File | Purpose |
|------|---------|
| `src/components/shared/logo.tsx` | Reusable Logo (icon + text) |
| `src/components/sections/auth-form.tsx` | Client-side reusable form (RHF + Zod + Server Actions) |
| `src/components/layout/app-sidebar.tsx` | Dashboard sidebar (nav items + user menu + logout) |
| `src/components/layout/dashboard-header.tsx` | Dashboard header (sidebar trigger + breadcrumb) |
| `src/app/(auth)/layout.tsx` | Auth split-screen layout |
| `src/app/(auth)/login/page.tsx` | Login page |
| `src/app/(auth)/register/page.tsx` | Register page |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout (SidebarProvider + sidebar + header) |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard placeholder page |

### Modified

| File | Change |
|------|--------|
| `src/app/globals.css` | Red accent CSS variables for both `:root` and `.dark` |
| `src/app/layout.tsx` | Add `dark` class, update metadata, set lang="pt-BR" |
| `src/app/page.tsx` | Redirect to /dashboard |

### Auto-generated (Shadcn)

| File | Source |
|------|--------|
| `src/components/ui/input.tsx` | `npx shadcn add sidebar` |
| `src/components/ui/separator.tsx` | `npx shadcn add sidebar` |
| `src/components/ui/skeleton.tsx` | `npx shadcn add sidebar` |
| `src/components/ui/tooltip.tsx` | `npx shadcn add sidebar` |
| `src/components/ui/sheet.tsx` | `npx shadcn add sidebar` |
| `src/components/ui/sidebar.tsx` | `npx shadcn add sidebar` |
| `src/components/ui/card.tsx` | `npx shadcn add card` |
| `src/components/ui/label.tsx` | `npx shadcn add label` |
| `src/components/ui/avatar.tsx` | `npx shadcn add avatar` |
| `src/components/ui/dropdown-menu.tsx` | `npx shadcn add dropdown-menu` |
| `src/hooks/use-mobile.ts` | `npx shadcn add sidebar` |

---

### Task 1: Install Shadcn components

**Files:**
- Auto-generated: 11 files in `src/components/ui/` and `src/hooks/`

- [ ] **Step 1: Install sidebar (includes input, separator, skeleton, tooltip, sheet, use-mobile)**

```bash
npx shadcn add sidebar --overwrite
```

This installs 7 files and overwrites `button.tsx` (base-nova update). Confirm overwrite.

- [ ] **Step 2: Install card, label, avatar, dropdown-menu**

```bash
npx shadcn add card label avatar dropdown-menu
```

Installs 4 files.

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build passes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ src/hooks/
git commit -m "feat: install Shadcn components (sidebar, card, label, avatar, dropdown-menu)"
```

---

### Task 2: Theme customization + root layout update

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update CSS variables in `src/app/globals.css`**

In the `:root` block, replace the `--primary`, `--primary-foreground`, and `--ring` lines:

```css
--primary: oklch(0.637 0.237 25.331);
--primary-foreground: oklch(0.985 0 0);
```

```css
--ring: oklch(0.637 0.237 25.331 / 40%);
```

In the `.dark` block, replace the same variables:

```css
--primary: oklch(0.637 0.237 25.331);
--primary-foreground: oklch(0.985 0 0);
```

```css
--ring: oklch(0.637 0.237 25.331 / 40%);
```

Also in `.dark`, replace `--sidebar-primary`:

```css
--sidebar-primary: oklch(0.637 0.237 25.331);
```

- [ ] **Step 2: Update `src/app/layout.tsx`**

Replace the entire file with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IA WhatsApp — Atendimento Inteligente",
  description:
    "Plataforma SaaS de atendimento ao cliente via WhatsApp com inteligencia artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
```

Key changes: `lang="pt-BR"`, `dark` class added, metadata updated, body gets explicit `bg-background text-foreground`.

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build passes.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: apply dark theme with red accent, update metadata to pt-BR"
```

---

### Task 3: Logo component

**Files:**
- Create: `src/components/shared/logo.tsx`

- [ ] **Step 1: Create `src/components/shared/logo.tsx`**

```tsx
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export function Logo({ collapsed = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
        <MessageSquare className="size-4 text-primary-foreground" />
      </div>
      {!collapsed && (
        <span className="text-lg font-bold tracking-tight">
          IA <span className="text-primary">WhatsApp</span>
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/logo.tsx
git commit -m "feat: add Logo component"
```

---

### Task 4: AuthForm component

**Files:**
- Create: `src/components/sections/auth-form.tsx`

- [ ] **Step 1: Create `src/components/sections/auth-form.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  placeholder: string;
}

interface AuthFormProps<T extends z.ZodType> {
  schema: T;
  fields: FieldConfig[];
  action: (data: unknown) => Promise<{ success: boolean; error?: string }>;
  submitLabel: string;
}

export function AuthForm<T extends z.ZodType>({
  schema,
  fields,
  action,
  submitLabel,
}: AuthFormProps<T>) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: z.infer<T>) {
    setError(null);
    startTransition(async () => {
      const result = await action(data);
      if (!result.success) {
        setError(result.error ?? "Erro desconhecido");
      }
    });
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            type={field.type}
            placeholder={field.placeholder}
            disabled={isPending}
            {...register(field.name)}
          />
          {errors[field.name] && (
            <p className="text-sm text-destructive">
              {errors[field.name]?.message as string}
            </p>
          )}
        </div>
      ))}

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </motion.form>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: Build passes (component is not yet imported anywhere, but TypeScript should type-check it).

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/auth-form.tsx
git commit -m "feat: add AuthForm component (RHF + Zod + Framer Motion)"
```

---

### Task 5: Auth layout + login page + register page

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Create `src/app/(auth)/layout.tsx`**

```tsx
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-card p-10 lg:flex">
        <Logo />
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Atendimento inteligente
            <br />
            via <span className="text-primary">WhatsApp</span>
          </h1>
          <p className="text-muted-foreground">
            Automatize o atendimento ao cliente com inteligencia artificial.
            Gerencie conversas, agentes e instancias em uma unica plataforma.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} IA WhatsApp
        </p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/(auth)/login/page.tsx`**

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { loginSchema } from "@/validators/auth";
import { login } from "@/actions/auth";
import { AuthForm } from "@/components/sections/auth-form";

export const metadata: Metadata = {
  title: "Entrar — IA WhatsApp",
};

const fields = [
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "seu@email.com",
  },
  {
    name: "password",
    label: "Senha",
    type: "password",
    placeholder: "••••••",
  },
];

export default function LoginPage() {
  return (
    <>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Entrar</h2>
        <p className="text-sm text-muted-foreground">
          Digite suas credenciais para acessar o painel
        </p>
      </div>

      <AuthForm
        schema={loginSchema}
        fields={fields}
        action={login}
        submitLabel="Entrar"
      />

      <p className="text-center text-sm text-muted-foreground">
        Nao tem conta?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Registre-se
        </Link>
      </p>
    </>
  );
}
```

- [ ] **Step 3: Create `src/app/(auth)/register/page.tsx`**

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { registerSchema } from "@/validators/auth";
import { register } from "@/actions/auth";
import { AuthForm } from "@/components/sections/auth-form";

export const metadata: Metadata = {
  title: "Criar conta — IA WhatsApp",
};

const fields = [
  {
    name: "companyName",
    label: "Nome da empresa",
    type: "text",
    placeholder: "Minha Empresa",
  },
  {
    name: "name",
    label: "Seu nome",
    type: "text",
    placeholder: "Joao Silva",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "seu@email.com",
  },
  {
    name: "password",
    label: "Senha",
    type: "password",
    placeholder: "••••••",
  },
];

export default function RegisterPage() {
  return (
    <>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Criar conta</h2>
        <p className="text-sm text-muted-foreground">
          Registre sua empresa para comecar a atender com IA
        </p>
      </div>

      <AuthForm
        schema={registerSchema}
        fields={fields}
        action={register}
        submitLabel="Criar conta"
      />

      <p className="text-center text-sm text-muted-foreground">
        Ja tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entre
        </Link>
      </p>
    </>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`

Expected: Build passes. `/login` and `/register` appear in routes.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat: add auth layout, login page, and register page"
```

---

### Task 6: AppSidebar + DashboardHeader

**Files:**
- Create: `src/components/layout/app-sidebar.tsx`
- Create: `src/components/layout/dashboard-header.tsx`

- [ ] **Step 1: Create `src/components/layout/app-sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Smartphone,
  Settings,
  LogOut,
  ChevronsUpDown,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/logo";
import { logout } from "@/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/conversas", label: "Conversas", icon: MessageSquare },
  { href: "/dashboard/agentes", label: "Agentes", icon: Bot },
  { href: "/dashboard/instancias", label: "Instancias", icon: Smartphone },
  { href: "/dashboard/configuracoes", label: "Configuracoes", icon: Settings },
];

interface AppSidebarProps {
  user: {
    name: string;
    email: string;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <Logo collapsed={false} />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side="top"
                align="start"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => logout()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 2: Create `src/components/layout/dashboard-header.tsx`**

```tsx
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface DashboardHeaderProps {
  children?: React.ReactNode;
}

export function DashboardHeader({ children }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      {children}
    </header>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build passes (components not yet imported in pages).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-sidebar.tsx src/components/layout/dashboard-header.tsx
git commit -m "feat: add AppSidebar and DashboardHeader components"
```

---

### Task 7: Dashboard layout + page

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getCurrentUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { name: true, email: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={{ name: user.name, email: user.email }} />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 2: Create `src/app/(dashboard)/dashboard/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard — IA WhatsApp",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao painel de controle
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Conversas ativas", value: "0" },
          { label: "Mensagens hoje", value: "0" },
          { label: "Agentes ativos", value: "0" },
          { label: "Instancias", value: "0" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build passes. `/dashboard` appears as dynamic route.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/
git commit -m "feat: add dashboard layout with sidebar and placeholder page"
```

---

### Task 8: Root page redirect + final verification

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update `src/app/page.tsx` to redirect**

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

The proxy.ts handles the auth check — if user has no token, they'll be redirected to `/login` by the proxy. If authenticated, they'll reach `/dashboard`.

- [ ] **Step 2: Verify full build**

Run: `npm run build`

Expected: Build passes with all routes:
- `/` (redirects)
- `/login` and `/register` (auth pages)
- `/dashboard` (dashboard page)
- `/api/auth/refresh` (API route)

- [ ] **Step 3: Run format**

Run: `npm run format && npm run format:check`

Expected: All files formatted correctly.

- [ ] **Step 4: Commit any changes**

```bash
git add src/app/page.tsx
git commit -m "feat: redirect root page to /dashboard"
```

If formatting changed files:
```bash
git add -A
git commit -m "style: format Fase 3 files"
```

- [ ] **Step 5: Start dev server and visually verify**

Run: `npm run dev`

Test the following:
1. Visit `http://localhost:3000/` — should redirect to `/login` (no auth token)
2. `/login` — dark theme, red accent buttons, split layout on desktop, form with email + password
3. `/register` — form with 4 fields, link back to login
4. Register a new account — should redirect to `/dashboard`
5. `/dashboard` — sidebar with 5 nav items, user menu in footer, header with trigger, 4 placeholder stat cards
6. Click user menu — dropdown with name, email, "Sair" button
7. Click "Sair" — redirects to `/login`
8. Resize to mobile — sidebar becomes sheet overlay, auth layout stacks vertically

---

## Final Verification

After all 8 tasks, confirm the Definition of Done:

- [ ] `npm run build` — passes with no errors
- [ ] Dark theme active with red accent visible on buttons and focus rings
- [ ] `/login` renders functional form that authenticates via Server Action
- [ ] `/register` renders functional form that creates account via Server Action
- [ ] `/dashboard` shows layout with collapsible sidebar and header
- [ ] Sidebar shows 5 nav items and user menu with logout
- [ ] Mobile: sidebar becomes sheet overlay, auth layout without split
- [ ] Redirect: `/` redirects to `/dashboard` (authenticated) or `/login` (unauthenticated)
