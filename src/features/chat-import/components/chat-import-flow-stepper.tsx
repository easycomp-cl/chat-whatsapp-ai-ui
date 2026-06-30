import {
  ChevronRight,
  HelpCircle,
  History,
  MessageSquareText,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FLOW_STEPS = [
  {
    step: 1,
    label: "Sube el chat",
    hint: "Archivo .txt de WhatsApp",
    icon: Upload,
    accent: "text-sky-600 bg-sky-100 dark:bg-sky-950",
  },
  {
    step: 2,
    label: "Ajusta el tono",
    hint: "Cómo hablará tu bot",
    icon: Sparkles,
    accent: "text-violet-600 bg-violet-100 dark:bg-violet-950",
  },
  {
    step: 3,
    label: "Revisa el historial",
    hint: "Progreso y resultados",
    icon: History,
    accent: "text-amber-600 bg-amber-100 dark:bg-amber-950",
  },
  {
    step: 4,
    label: "Aprueba FAQs",
    hint: "Preguntas para el bot",
    icon: HelpCircle,
    accent: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950",
  },
] as const;

export function ChatImportFlowStepper() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageSquareText className="size-4" />
        Así funciona en 4 pasos
      </div>
      <ol className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
        {FLOW_STEPS.map((item, index) => (
          <li key={item.step} className="contents">
            <div className="flex items-start gap-3 sm:block sm:text-center">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full sm:mx-auto",
                  item.accent
                )}
              >
                <item.icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 sm:mt-2">
                <p className="text-sm font-semibold leading-tight">{item.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
              </div>
            </div>
            {index < FLOW_STEPS.length - 1 && (
              <ChevronRight
                className="mx-auto hidden size-4 shrink-0 text-muted-foreground/50 sm:block"
                aria-hidden
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
