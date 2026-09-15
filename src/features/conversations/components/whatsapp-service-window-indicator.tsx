"use client";

import { AppWindow } from "lucide-react";
import {
  formatServiceWindowClosedSince,
  formatServiceWindowCountdown,
  type WhatsappServiceWindowState,
} from "@/lib/conversations/whatsapp-service-window";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type WhatsappServiceWindowIndicatorProps = {
  state: WhatsappServiceWindowState;
  handoffReason?: string | null;
  className?: string;
};

function getTooltipContent(state: WhatsappServiceWindowState, handoffReason?: string | null) {
  if (state.status === "open" || state.status === "closing") {
    const urgency =
      state.status === "closing"
        ? " Queda menos de 1 hora."
        : "";
    return `Quedan ${formatServiceWindowCountdown(state.remainingMs)} de las 24 h de WhatsApp, contadas desde el último mensaje del cliente.${urgency} Mientras el contador no llegue a 00:00:00 puedes enviar texto, fotos, audio y botones. Al llegar a cero solo podrás usar plantillas aprobadas por Meta.`;
  }

  if (state.status === "closed") {
    const since = state.expiresAt
      ? ` Cerrada ${formatServiceWindowClosedSince(state.expiresAt)}.`
      : "";
    const handoff = handoffReason
      ? " Para dar seguimiento a la derivación, usa una plantilla UTILITY o espera a que el cliente escriba."
      : " Para recontactar, usa una plantilla UTILITY aprobada o espera a que el cliente escriba.";
    return `Ventana de 24 h cerrada.${since} Los mensajes libres no llegan al cliente.${handoff}`;
  }

  return "Este cliente aún no ha escrito por WhatsApp. Solo puedes iniciar la conversación con una plantilla aprobada.";
}

function getDisplayCountdown(state: WhatsappServiceWindowState) {
  if (state.status === "open" || state.status === "closing") {
    return formatServiceWindowCountdown(state.remainingMs);
  }
  return "00:00:00";
}

export function WhatsappServiceWindowIndicator({
  state,
  handoffReason,
  className,
}: WhatsappServiceWindowIndicatorProps) {
  const countdown = getDisplayCountdown(state);
  const isClosing = state.status === "closing";
  const isClosed = state.status === "closed" || state.status === "unknown";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "inline-flex shrink-0 cursor-default items-center gap-1 rounded px-1 py-0.5",
              isClosed && "text-[#ff7a55]",
              isClosing && "text-amber-700",
              !isClosed && !isClosing && "text-[#00a884]",
              className
            )}
            aria-live="polite"
            aria-label={`Ventana de respuesta WhatsApp: ${countdown}`}
          />
        }
      >
        <AppWindow className="size-3 shrink-0 opacity-80" aria-hidden />
        <span
          className={cn(
            "font-mono text-[10px] font-semibold tabular-nums leading-none",
            isClosed ? "text-[#ff7a55]" : "text-[#111b21]"
          )}
        >
          {countdown}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {getTooltipContent(state, handoffReason)}
      </TooltipContent>
    </Tooltip>
  );
}
