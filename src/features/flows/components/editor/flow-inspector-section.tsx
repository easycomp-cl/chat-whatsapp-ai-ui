"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { flowEditorTheme } from "./flow-editor-theme";

type FlowInspectorSectionProps = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  badge?: string | number;
  children: React.ReactNode;
};

export function FlowInspectorSection({
  title,
  subtitle,
  defaultOpen = false,
  badge,
  children,
}: FlowInspectorSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className="rounded-lg border bg-white shadow-sm"
      style={{ borderColor: flowEditorTheme.panelBorder }}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
          style={{ color: flowEditorTheme.panelMuted }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: flowEditorTheme.ink }}>
            {title}
          </p>
          {subtitle && (
            <p className="truncate text-[11px]" style={{ color: flowEditorTheme.panelMuted }}>
              {subtitle}
            </p>
          )}
        </div>
        {badge !== undefined && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: flowEditorTheme.panelAccent, color: flowEditorTheme.ink }}
          >
            {badge}
          </span>
        )}
      </button>
      {open && <div className="border-t px-3 py-3" style={{ borderColor: flowEditorTheme.panelBorder }}>{children}</div>}
    </section>
  );
}
