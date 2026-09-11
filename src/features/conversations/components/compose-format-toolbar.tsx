"use client";

import type { ReactNode } from "react";
import { Bold, Italic, Strikethrough } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isRangeFormatted,
  toggleFormatOnRange,
  type WhatsAppFormatMarker,
} from "@/lib/conversations/whatsapp-format-selection";

export type TextSelection = {
  start: number;
  end: number;
};

type ComposeFormatToolbarProps = {
  text: string;
  selection: TextSelection;
  onFormat: (nextText: string, nextSelection: TextSelection) => void;
  className?: string;
};

export function ComposeFormatToolbar({
  text,
  selection,
  onFormat,
  className,
}: ComposeFormatToolbarProps) {
  function applyFormat(marker: WhatsAppFormatMarker) {
    const result = toggleFormatOnRange(text, selection.start, selection.end, marker);
    onFormat(result.text, {
      start: result.selectionStart,
      end: result.selectionEnd,
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-md border border-[#d1d7db] bg-white px-0.5 py-px",
        className
      )}
      onMouseDown={(event) => event.preventDefault()}
    >
      <FormatToolbarButton
        label="Negrita"
        active={isRangeFormatted(text, selection.start, selection.end, "*")}
        onClick={() => applyFormat("*")}
      >
        <Bold className="size-3.5 stroke-[2.25]" />
      </FormatToolbarButton>
      <FormatToolbarButton
        label="Cursiva"
        active={isRangeFormatted(text, selection.start, selection.end, "_")}
        onClick={() => applyFormat("_")}
      >
        <Italic className="size-3.5 stroke-[2.25]" />
      </FormatToolbarButton>
      <FormatToolbarButton
        label="Tachado"
        active={isRangeFormatted(text, selection.start, selection.end, "~")}
        onClick={() => applyFormat("~")}
      >
        <Strikethrough className="size-3.5 stroke-[2.25]" />
      </FormatToolbarButton>
    </div>
  );
}

function FormatToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "rounded-sm p-0.5 text-[#54656f] transition-colors hover:bg-[#f0f2f5] hover:text-[#111b21]",
        active && "bg-[#e7f8f3] text-[#008069] hover:bg-[#d9f5ec]"
      )}
    >
      {children}
    </button>
  );
}
