"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFullTime } from "@/lib/conversations/utils";

type AiEvent = { id: string; event_type: string; created_at: string };

export function AiEventsAccordion({ events }: { events: AiEvent[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-xl border border-[#7678ed]/15 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-[#f9fafc]"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#202022]/60">
          <Sparkles className="size-3.5 text-[#7678ed]" />
          Eventos de IA
          {events.length > 0 && (
            <span className="rounded-full bg-[#ff7a55] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {events.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[#202022]/40 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-[#7678ed]/10 px-4 py-3">
          {events.length === 0 ? (
            <p className="text-sm text-[#202022]/40">Sin eventos registrados</p>
          ) : (
            <ul className="space-y-2">
              {events.slice(0, 8).map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-[#7678ed]/10 bg-[#7678ed]/5 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-[#7678ed]">{e.event_type}</span>
                  <p className="mt-0.5 text-[#202022]/45">{formatFullTime(e.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
