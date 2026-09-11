"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Workflow, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelFlowRunAction } from "@/lib/actions/flow-actions";
import { FLOW_RUN_STATUS_LABELS } from "@/lib/flows/utils";
import type { ActiveFlowRunDetail, ActiveFlowRunInbox } from "@/lib/bot-api/types";

type FlowRunBannerProps = {
  run: ActiveFlowRunDetail | ActiveFlowRunInbox;
  onCancelled?: () => void;
};

export function FlowRunBanner({ run, onCancelled }: FlowRunBannerProps) {
  const [pending, startTransition] = useTransition();
  const flowName = "flow_name" in run ? run.flow_name : "Flujo activo";
  const flowVersion = "flow_version" in run ? run.flow_version : null;

  function handleCancel() {
    if (!confirm("¿Cancelar el flujo activo en esta conversación?")) return;
    startTransition(async () => {
      try {
        await cancelFlowRunAction(run.id);
        toast.success("Flujo cancelado");
        onCancelled?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo cancelar el flujo");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#7678ed]/20 bg-[#7678ed]/8 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-[#202022]">
        <Workflow className="size-4 text-[#7678ed]" />
        <span className="font-medium">{flowName}</span>
        {flowVersion !== null && (
          <span className="text-[#202022]/50">· v{flowVersion}</span>
        )}
        <span className="text-[#202022]/50">·</span>
        <span className="text-[#7678ed]">{FLOW_RUN_STATUS_LABELS[run.status]}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          render={<Link href={`/app/flujos/revisiones`} />}
        >
          Revisiones
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={pending}
          onClick={handleCancel}
        >
          <X className="size-3.5" />
          Cancelar flujo
        </Button>
      </div>
    </div>
  );
}
