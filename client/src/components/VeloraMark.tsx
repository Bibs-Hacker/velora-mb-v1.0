import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function VeloraMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <div className={cn("flex items-center gap-2.5", className)} aria-label="Velora">
    <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[linear-gradient(135deg,#4155db_0%,#8d45bd_58%,#ff8b6a_100%)] text-white shadow-[0_10px_24px_rgba(65,85,219,.25)]"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>
    {!compact && <span className="font-display text-xl font-semibold tracking-[-0.06em] text-foreground">velora</span>}
  </div>;
}
