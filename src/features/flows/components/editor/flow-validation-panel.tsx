"use client";

import type { FlowValidationIssue } from "@/lib/flows/graph-types";
import { getNodeIdFromValidationPath } from "@/lib/flows/graph-validation";
import { cn } from "@/lib/utils";
import { flowEditorTheme } from "./flow-editor-theme";

type FlowValidationPanelProps = {
  issues: FlowValidationIssue[];
  onIssueClick?: (issue: FlowValidationIssue) => void;
};

export function FlowValidationPanel({ issues, onIssueClick }: FlowValidationPanelProps) {
  if (issues.length === 0) {
    return (
      <div
        className="rounded-lg border px-3 py-2 text-sm"
        style={{
          borderColor: "#A7D4B8",
          background: "#E8F5EE",
          color: "#1F4D35",
        }}
      >
        Sin errores de validación. El flujo puede publicarse.
      </div>
    );
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div
      className="space-y-2 rounded-lg border p-3"
      style={{
        borderColor: flowEditorTheme.panelBorder,
        background: flowEditorTheme.panelAccent,
      }}
    >
      <p className="text-sm font-medium" style={{ color: flowEditorTheme.ink }}>
        {errors.length > 0
          ? `${errors.length} error(es) — puedes guardar borrador pero no publicar`
          : `${warnings.length} advertencia(s)`}
      </p>
      <p className="text-[11px]" style={{ color: flowEditorTheme.panelMuted }}>
        Haz clic en un error para ir al nodo y corregirlo.
      </p>
      <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
        {issues.map((issue, index) => {
          const nodeId = getNodeIdFromValidationPath(issue.path);
          const clickable = Boolean(onIssueClick && nodeId);

          return (
            <li key={`${issue.path}-${index}`}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onIssueClick?.(issue)}
                className={cn(
                  "w-full rounded px-2 py-1 text-left",
                  issue.severity === "error"
                    ? "bg-red-100 text-red-900"
                    : "bg-amber-100 text-amber-900",
                  clickable && "cursor-pointer hover:brightness-95 underline-offset-2 hover:underline"
                )}
              >
                {issue.message}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
