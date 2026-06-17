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
