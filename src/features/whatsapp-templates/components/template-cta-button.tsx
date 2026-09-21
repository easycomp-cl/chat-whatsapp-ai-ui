"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TemplateCta } from "../template-cta";

type TemplateCtaButtonProps = {
  cta: TemplateCta;
  compact?: boolean;
  variant?: "preview" | "chat";
  className?: string;
};

export function TemplateCtaButton({
  cta,
  compact = false,
  variant = "preview",
  className,
}: TemplateCtaButtonProps) {
  const tooltipText = cta.url ? `${cta.hint}: ${cta.url}` : cta.hint;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            title={tooltipText}
            aria-label={tooltipText}
            className={cn(
              "flex w-full cursor-help items-center justify-center gap-1.5 font-medium select-none",
              compact ? "px-3 py-2 text-[13px]" : "px-3 py-2.5 text-sm",
              variant === "preview"
                ? "bg-white/90 text-[#027eb5]"
                : "bg-white/70 text-[#027eb5] hover:bg-white/90",
              className
            )}
          >
            <ExternalLink className={cn("shrink-0", compact ? "size-3.5" : "size-4")} aria-hidden />
            {cta.label}
          </span>
        }
      />
      <TooltipContent side="top" className="max-w-xs">
        <div className="flex min-w-0 flex-col gap-1 text-left leading-relaxed">
          <p className="font-medium">{cta.hint}</p>
          {cta.url ? (
            <p className="break-all text-[11px] opacity-90">{cta.url}</p>
          ) : (
            <p className="text-[11px] opacity-80">
              El valor exacto queda en el botón que recibe el cliente en WhatsApp.
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
