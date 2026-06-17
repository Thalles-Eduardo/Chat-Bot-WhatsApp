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
