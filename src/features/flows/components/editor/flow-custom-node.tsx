"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { FlowNodeType } from "@/lib/flows/graph-types";
import { flowEditorTheme, flowNodeTypeTheme } from "./flow-editor-theme";
import { FlowNodeTypeIcon } from "./flow-node-type-icon";

export type FlowNodeData = {
  flowType: FlowNodeType;
  label: string;
};

function FlowCustomNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as FlowNodeData;
  const theme = flowNodeTypeTheme[nodeData.flowType] ?? {
    border: "#94A3B8",
    accent: "#64748B",
    iconBg: "#F1F5F9",
  };

  return (
    <div
      className={cn(
        "flex min-w-[176px] items-center gap-2.5 rounded-xl border-2 bg-white px-2.5 py-2 shadow-md",
        selected && "ring-2 ring-offset-2"
      )}
      style={{
        borderColor: theme.border,
        ...(selected ? { boxShadow: `0 0 0 2px ${flowEditorTheme.selectionRing}40` } : {}),
      }}
    >
      {nodeData.flowType !== "start" && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: flowEditorTheme.handle, borderColor: flowEditorTheme.panel }}
        />
      )}

      <FlowNodeTypeIcon type={nodeData.flowType as FlowNodeType} size="md" className="rounded-lg" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.accent }}>
          {nodeData.flowType.replace(/_/g, " ")}
        </p>
        <p className="truncate text-sm font-semibold" style={{ color: flowEditorTheme.ink }}>
          {nodeData.label}
        </p>
      </div>

      {nodeData.flowType !== "end" && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: flowEditorTheme.handle, borderColor: flowEditorTheme.panel }}
        />
      )}
    </div>
  );
}

export const FlowCustomNode = memo(FlowCustomNodeComponent);
