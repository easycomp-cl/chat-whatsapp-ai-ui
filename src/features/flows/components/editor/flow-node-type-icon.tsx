"use client";

import type { CSSProperties } from "react";
import type { FlowNodeType } from "@/lib/flows/graph-types";
import { flowNodeTypeTheme } from "./flow-editor-theme";
import { getFlowNodeIcon } from "./flow-node-icons";

type FlowNodeTypeIconProps = {
  type: FlowNodeType;
  size?: "sm" | "md";
  className?: string;
};

const SIZE_CLASSES = {
  sm: { box: "size-6", icon: "size-3.5" },
  md: { box: "size-9", icon: "size-4" },
} as const;

export function FlowNodeTypeIcon({ type, size = "sm", className }: FlowNodeTypeIconProps) {
  const theme = flowNodeTypeTheme[type] ?? {
    border: "#94A3B8",
    accent: "#64748B",
    iconBg: "#F1F5F9",
  };
  const Icon = getFlowNodeIcon(type);
  const sizes = SIZE_CLASSES[size];

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md ${sizes.box} ${className ?? ""}`}
      style={{ backgroundColor: theme.iconBg }}
    >
      <Icon className={sizes.icon} style={{ color: theme.accent } as CSSProperties} />
    </span>
  );
}
