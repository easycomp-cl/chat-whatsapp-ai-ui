"use client";

import { CheckCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { splitTemplateBody } from "../utils";
import type { TemplateExample } from "../standard-pack";

type WhatsappTemplateBubbleProps = {
  body: string;
  examples?: TemplateExample[];
  /** Valores reales al componer; si hay texto, sustituye el placeholder. */
  values?: string[];
  highlightIndex?: number | null;
  compose?: boolean;
  footer?: string | null;
  buttonLabel?: string | null;
  compact?: boolean;
  className?: string;
};

export function WhatsappTemplateBubble({
  body,
  examples = [],
  values,
  highlightIndex = null,
  compose = false,
  footer,
  buttonLabel,
  compact = false,
  className,
}: WhatsappTemplateBubbleProps) {
  const parts = splitTemplateBody(body);

  return (
    <div className={cn("flex w-full justify-end", compact ? "p-3" : "p-4", className)}>
      <div className="max-w-[92%]">
        <div
          className={cn(
            "rounded-lg rounded-tr-none bg-[#d9fdd3] text-[#111b21] shadow-sm ring-1 ring-[#b8e8b0]/80",
            compact ? "px-2.5 py-1.5 text-[13px]" : "px-3 py-2 text-sm"
          )}
        >
          <p className="leading-relaxed whitespace-pre-wrap wrap-anywhere">
            {parts.map((part, index) => {
              if (part.type === "text") {
                return <span key={index}>{part.value}</span>;
              }

              const filled = values?.[part.index - 1]?.trim() ?? "";
              const highlighted = highlightIndex === part.index;

              if (compose) {
                if (!filled) {
                  return (
                    <span
                      key={index}
                      className={cn(
                        "mx-px inline-flex items-baseline rounded-md bg-[#7678ed]/18 px-1 py-px font-semibold text-[#4f4cc8] transition-shadow",
                        highlighted && "ring-2 ring-[#7678ed]/70 ring-offset-1 ring-offset-[#d9fdd3]"
                      )}
                    >
                      {`{{${part.index}}}`}
                    </span>
                  );
                }

                return (
                  <span
                    key={index}
                    className={cn(
                      "rounded-sm bg-[#b7e0ae]/80 px-0.5 font-medium text-[#0b5c4a] transition-shadow",
                      highlighted && "ring-2 ring-[#7678ed]/60 ring-offset-1 ring-offset-[#d9fdd3]"
                    )}
                  >
                    {filled}
                  </span>
                );
              }

              const example = examples[part.index - 1]?.value?.trim();
              if (!example) {
                return (
                  <span
                    key={index}
                    className="rounded-sm bg-[#b7e0ae]/80 px-0.5 font-medium text-[#1f6b4a]"
                  >
                    {`{{${part.index}}}`}
                  </span>
                );
              }

              return (
                <span
                  key={index}
                  className="font-medium text-[#0b5c4a]"
                  title={`Parámetro ${part.index}`}
                >
                  {`{${example}}`}
                  <sup className="ml-px text-[9px] font-semibold text-[#1f6b4a]/75">
                    {part.index}
                  </sup>
                </span>
              );
            })}
          </p>
          {footer ? (
            <p className={cn("mt-1.5 text-[#667781]", compact ? "text-[10px]" : "text-[11px]")}>
              {footer}
            </p>
          ) : null}
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#667781]">
            <span>12:04</span>
            <CheckCheck className="size-3 text-[#53bdeb]" aria-hidden />
          </div>
        </div>
        {buttonLabel ? (
          <div className="mt-1 overflow-hidden rounded-lg bg-white/90 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#027eb5]">
              <ExternalLink className="size-3.5" aria-hidden />
              {buttonLabel}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
