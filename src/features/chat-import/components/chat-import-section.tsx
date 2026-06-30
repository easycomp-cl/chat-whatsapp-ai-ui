import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ACCENT_STYLES = {
  upload: {
    badge: "bg-sky-600 text-white",
    icon: "text-sky-600",
    panel: "border-sky-200/80 bg-sky-50/40 dark:border-sky-900/60 dark:bg-sky-950/20",
  },
  tone: {
    badge: "bg-violet-600 text-white",
    icon: "text-violet-600",
    panel:
      "border-violet-200/80 bg-violet-50/40 dark:border-violet-900/60 dark:bg-violet-950/20",
  },
  history: {
    badge: "bg-amber-600 text-white",
    icon: "text-amber-600",
    panel:
      "border-amber-200/80 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20",
  },
  faqs: {
    badge: "bg-emerald-600 text-white",
    icon: "text-emerald-600",
    panel:
      "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20",
  },
} as const;

export type ChatImportSectionAccent = keyof typeof ACCENT_STYLES;

export function ChatImportSection({
  step,
  title,
  description,
  icon: Icon,
  accent,
  children,
  className,
}: {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: ChatImportSectionAccent;
  children: ReactNode;
  className?: string;
}) {
  const styles = ACCENT_STYLES[accent];

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
            styles.badge
          )}
          aria-hidden
        >
          {step}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className={cn("size-5 shrink-0", styles.icon)} aria-hidden />
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className={cn("rounded-xl border p-4 sm:p-5", styles.panel)}>
        {children}
      </div>
    </section>
  );
}
