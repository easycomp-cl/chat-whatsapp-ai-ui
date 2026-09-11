"use client";

import { useMemo } from "react";
import type { FlowDefinitionGraph, FlowNode } from "@/lib/flows/graph-types";
import { getFlowNodeLabel } from "@/lib/flows/graph-layout";
import { getLinearNodePath } from "@/lib/flows/flow-local-simulator";
import { flowEditorTheme, flowNodeTypeTheme } from "./flow-editor-theme";
import { FlowNodeTypeIcon } from "./flow-node-type-icon";
import { cn } from "@/lib/utils";

type FlowStepWheelProps = {
  graph: FlowDefinitionGraph;
  currentNodeId: string | null;
};

function WheelConnector() {
  return (
    <div className="flex flex-col items-center py-0.5">
      <div className="h-2 w-px" style={{ background: flowEditorTheme.panelBorder }} />
      <div
        className="size-1 rounded-full"
        style={{ background: flowEditorTheme.panelMuted }}
      />
      <div className="h-2 w-px" style={{ background: flowEditorTheme.panelBorder }} />
    </div>
  );
}

function WheelSlot({
  node,
  variant,
}: {
  node: FlowNode | null;
  variant: "previous" | "focus" | "next" | "empty";
}) {
  if (!node && variant === "empty") {
    return (
      <div
        className="flex h-10 w-full items-center justify-center rounded-lg border border-dashed text-[10px]"
        style={{ borderColor: flowEditorTheme.panelBorder, color: flowEditorTheme.panelMuted }}
      >
        —
      </div>
    );
  }

  if (!node) {
    const label =
      variant === "previous" ? "Sin paso anterior" : variant === "next" ? "Sin paso siguiente" : "";
    return (
      <div
        className="flex h-10 w-full items-center justify-center rounded-lg text-[10px] italic opacity-40"
        style={{ color: flowEditorTheme.panelMuted }}
      >
        {label}
      </div>
    );
  }

  const theme = flowNodeTypeTheme[node.type] ?? {
    border: "#94A3B8",
    accent: "#64748B",
    iconBg: "#F1F5F9",
  };
  const isFocus = variant === "focus";

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 transition-all",
        isFocus ? "scale-100 shadow-md" : "scale-[0.92] opacity-45"
      )}
      style={{
        borderColor: isFocus ? flowEditorTheme.primary : theme.border,
        background: isFocus ? "#fff" : flowEditorTheme.panel,
      }}
    >
      <FlowNodeTypeIcon type={node.type} size="sm" />
      <div className="min-w-0 flex-1">
        <p
          className={cn("truncate text-xs font-semibold", isFocus && "text-sm")}
          style={{ color: flowEditorTheme.ink }}
        >
          {node.label ?? getFlowNodeLabel(node.type)}
        </p>
        <p className="truncate text-[10px] capitalize" style={{ color: theme.accent }}>
          {getFlowNodeLabel(node.type)}
        </p>
      </div>
      {isFocus && (
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
          style={{ background: flowEditorTheme.primary }}
        >
          Ahora
        </span>
      )}
    </div>
  );
}

export function FlowStepWheel({ graph, currentNodeId }: FlowStepWheelProps) {
  const { previous, focus, next, position, total } = useMemo(() => {
    const path = getLinearNodePath(graph);
    const index = path.findIndex((n) => n.id === currentNodeId);
    const focusIndex = index >= 0 ? index : 0;

    return {
      previous: path[focusIndex - 1] ?? null,
      focus: path[focusIndex] ?? path[0] ?? null,
      next: path[focusIndex + 1] ?? null,
      position: focusIndex + 1,
      total: path.length,
    };
  }, [graph, currentNodeId]);

  return (
    <div
      className="rounded-xl border bg-white p-3 shadow-sm"
      style={{ borderColor: flowEditorTheme.panelBorder }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: flowEditorTheme.ink }}>
          Paso actual
        </p>
        <span className="text-[10px]" style={{ color: flowEditorTheme.panelMuted }}>
          {position} / {total}
        </span>
      </div>

      <div className="flex flex-col items-stretch">
        <WheelSlot node={previous} variant={previous ? "previous" : "empty"} />
        <WheelConnector />
        <WheelSlot node={focus} variant="focus" />
        <WheelConnector />
        <WheelSlot node={next} variant={next ? "next" : "empty"} />
      </div>
    </div>
  );
}
