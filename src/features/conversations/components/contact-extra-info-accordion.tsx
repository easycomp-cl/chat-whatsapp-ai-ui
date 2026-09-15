"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFullTime } from "@/lib/conversations/utils";

type ContactExtraInfoAccordionProps = {
  channel: string;
  lastMessageAt: string;
  conversationCreatedAt: string;
  whatsappName?: string | null;
  showWhatsappName: boolean;
};

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.75rem_minmax(0,1fr)] items-start gap-x-2">
      <dt className="text-left text-xs leading-5 text-[#202022]/50">{label}</dt>
      <dd className="min-w-0 text-right text-xs font-medium leading-5 wrap-break-word text-[#202022] tabular-nums">
        {value}
      </dd>
    </div>
  );
}

export function ContactExtraInfoAccordion({
  channel,
  lastMessageAt,
  conversationCreatedAt,
  whatsappName,
  showWhatsappName,
}: ContactExtraInfoAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 w-full border-t border-[#202022]/8 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#202022]/50">
          <Info className="size-3.5 text-[#7678ed]" />
          Más información
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#202022]/40 transition-transform duration-300 ease-in-out",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <dl
            className={cn(
              "flex flex-col gap-2.5 pt-3 transition-opacity duration-300 ease-in-out",
              open ? "opacity-100" : "opacity-0"
            )}
          >
            {showWhatsappName && whatsappName?.trim() && (
              <InfoRow label="WhatsApp" value={whatsappName} />
            )}
            <InfoRow label="Canal" value={channel} />
            <InfoRow label="Últ. mensaje" value={formatFullTime(lastMessageAt)} />
            <InfoRow label="Chat creado" value={formatFullTime(conversationCreatedAt)} />
          </dl>
        </div>
      </div>
    </div>
  );
}
