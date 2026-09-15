"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Loader2, Play, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startConversationFlowAction } from "@/lib/actions/flow-actions";
import type { ConversationFlowState, FlowDefinition } from "@/lib/bot-api/types";
import { cn } from "@/lib/utils";

type ActivateFlowsAccordionProps = {
  conversationId: string;
  flows: FlowDefinition[];
  flowState?: ConversationFlowState | null;
};

export function ActivateFlowsAccordion({
  conversationId,
  flows,
  flowState = null,
}: ActivateFlowsAccordionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingFlowId, setPendingFlowId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasActiveRun = Boolean(flowState?.active_flow_run);
  const flowBlocked = hasActiveRun || flowState?.flow_mode_locked === true;

  function handleActivate(flow: FlowDefinition) {
    if (flowBlocked) {
      toast.error("Ya hay un flujo activo en esta conversación");
      return;
    }

    startTransition(async () => {
      setPendingFlowId(flow.id);
      try {
        await startConversationFlowAction(conversationId, flow.id);
        toast.success(`Flujo «${flow.name}» activado`);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "No se pudo activar el flujo";
        toast.error(message);
      } finally {
        setPendingFlowId(null);
      }
    });
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[#7678ed]/15 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-w-0 items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-[#f9fafc]"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#202022]/60">
          <Workflow className="size-3.5 shrink-0 text-[#7678ed]" />
          <span className="truncate">Activar flujo</span>
          {flows.length > 0 && (
            <span className="shrink-0 rounded-full bg-[#7678ed] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {flows.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#202022]/40 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-[#7678ed]/10 px-4 py-3">
          {flowBlocked && (
            <p className="mb-3 rounded-lg border border-[#7678ed]/15 bg-[#7678ed]/5 px-3 py-2 text-xs text-[#202022]/65">
              Hay un flujo en curso. Cancela el flujo activo para iniciar otro.
            </p>
          )}

          {flows.length === 0 ? (
            <div className="space-y-2 text-sm text-[#202022]/45">
              <p>No hay flujos activos publicados.</p>
              <Link
                href="/app/flows"
                className="text-xs font-medium text-[#7678ed] hover:underline"
              >
                Crear o publicar flujos
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {flows.map((flow) => {
                const versionNumber = flow.current_version?.version_number;
                const isActivating = pending && pendingFlowId === flow.id;

                return (
                  <li
                    key={flow.id}
                    className="flex min-w-0 items-start justify-between gap-2 rounded-lg border border-[#7678ed]/10 bg-[#7678ed]/5 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#202022]">{flow.name}</p>
                      {flow.description?.trim() && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#202022]/50">
                          {flow.description.trim()}
                        </p>
                      )}
                      {versionNumber != null && (
                        <p className="mt-1 text-[10px] text-[#7678ed]">v{versionNumber}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 gap-1 border-[#7678ed]/25 text-xs text-[#7678ed] hover:bg-[#7678ed]/10"
                      disabled={flowBlocked || isActivating}
                      onClick={() => handleActivate(flow)}
                    >
                      {isActivating ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Play className="size-3.5" />
                      )}
                      Activar
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
