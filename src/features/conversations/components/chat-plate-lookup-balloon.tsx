"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, Car, Info, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { lookupConversationVehiclePlateAction } from "@/lib/actions/vehicle-actions";
import type { VehiclePlateLookupResponse } from "@/lib/bot-api/vehicles";
import {
  formatPlateDisplay,
  formatPlateEntry,
  plateCategoryFromType,
  vehicleFactRows,
  type PlateCategory,
} from "@/lib/customers/vehicle";

type ChatPlateLookupBalloonProps = {
  conversationId: string;
  onResolved?: () => void;
  onDismiss?: () => void;
};

function PrivateNoteHint() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="inline-flex rounded-full p-0.5 text-[#8d8d8d] transition-colors hover:text-[#F8F8F8]"
            aria-label="El cliente no ve esta información"
          />
        }
      >
        <Info className="size-3.5" strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-56 bg-white text-left text-[#141414] shadow-lg [&_[class*='rotate-45']]:bg-white [&_[class*='rotate-45']]:fill-white"
      >
        El cliente no ve esta información. No se envía por WhatsApp.
      </TooltipContent>
    </Tooltip>
  );
}

function categoryOf(lookup: VehiclePlateLookupResponse): PlateCategory | null {
  return formatPlateEntry(lookup.plate).category ?? plateCategoryFromType(lookup.vehicle_type);
}

function categoryLabel(category: PlateCategory | null, complete: boolean): string {
  if (!complete) return "Auto o moto";
  if (category === "moto") return "Moto";
  if (category === "auto") return "Auto";
  return "Auto o moto";
}

export function ChatPlateLookupBalloon({ conversationId, onResolved, onDismiss }: ChatPlateLookupBalloonProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState("");
  const [entry, setEntry] = useState(() => formatPlateEntry(""));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [lookup, setLookup] = useState<VehiclePlateLookupResponse | null>(null);

  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (lookup) rootRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [lookup]);

  function handleChange(value: string) {
    const next = formatPlateEntry(value);
    setEntry(next);
    setDisplay(next.display);
    setError("");
  }

  async function handleSubmit() {
    if (pending) return;
    const current = formatPlateEntry(display);
    setEntry(current);
    if (!current.complete) {
      setError(current.formatError || "Ingresa una patente válida antes de consultar.");
      return;
    }

    setPending(true);
    setError("");
    const result = await lookupConversationVehiclePlateAction(conversationId, current.compact);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const next = result.result;
    if (next.status === "invalid_plate") {
      setError(
        current.category === "moto"
          ? "El formato de moto es válido en la UI, pero el servidor todavía no lo acepta."
          : "El formato de la patente no es válido."
      );
      return;
    }
    if (next.status === "provider_not_configured") {
      setError("Sin API de patentes. Pide marca, modelo y año.");
      return;
    }
    if (next.status === "not_found") {
      setError("No encontramos esa patente.");
      return;
    }
    setLookup(next);
    onResolved?.();
  }

  const category = lookup ? categoryOf(lookup) : entry.category;
  const phase = lookup ? "result" : pending ? "loading" : "draft";
  const plateDisplay = lookup
    ? lookup.plate_display?.trim() || formatPlateDisplay(lookup.plate)
    : display;
  const rows = lookup
    ? vehicleFactRows({
        plate: lookup.plate,
        plateDisplay,
        make: lookup.make,
        model: lookup.model,
        year: lookup.year,
        version: lookup.version,
        color: lookup.color,
        fuel: lookup.fuel,
        transmission: lookup.transmission,
        engine: lookup.engine,
        vin: lookup.vin,
        vehicleType: lookup.vehicle_type,
      }).filter((row) => row.label !== "Patente")
    : [];
  const liveHint = !entry.complete && entry.compact ? entry.formatError : null;

  return (
    <div ref={rootRef} className="flex justify-center px-3 py-1.5" data-plate-lookup={phase}>
      <div className="flex w-full max-w-[340px] items-start gap-3 rounded-2xl border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-[#F8F8F8] shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2A2A2A]">
          {category === "moto" ? (
            <Bike className="size-4 text-[#F8F8F8]" strokeWidth={2} />
          ) : (
            <Car className="size-4 text-[#F8F8F8]" strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          {lookup ? (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-1">
                  <p className="text-[11px] font-semibold tracking-wide text-[#C8C8C8] uppercase">
                    {category === "moto" ? "Moto" : "Auto"}
                  </p>
                  <PrivateNoteHint />
                </div>
                <p className="text-[13px] font-semibold tracking-wide text-[#F8F8F8]">{plateDisplay}</p>
              </div>
              {rows.length > 0 ? (
                <dl className="mt-2 space-y-1 border-t border-[#2A2A2A] pt-2">
                  {rows.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-3 text-[12px] leading-snug">
                      <dt className="shrink-0 text-[#8d8d8d]">{row.label}</dt>
                      <dd className="text-right wrap-anywhere text-[#F8F8F8]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-1 text-[13px] text-[#C8C8C8]">Sin datos extra del vehículo.</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <p className="text-[13px] font-semibold tracking-tight text-[#F8F8F8]">Consultar patente</p>
                  <PrivateNoteHint />
                </div>
                {onDismiss ? (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="text-[11px] text-[#8d8d8d] hover:text-[#F8F8F8]"
                  >
                    Cerrar
                  </button>
                ) : null}
              </div>
              <input
                ref={inputRef}
                value={display}
                onChange={(event) => handleChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSubmit();
                  }
                }}
                placeholder="BB BB 12"
                autoComplete="off"
                spellCheck={false}
                disabled={pending}
                aria-label="Patente"
                aria-invalid={Boolean(error || liveHint)}
                className="mt-2 w-full rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2 text-center text-[15px] font-semibold tracking-[0.14em] text-[#F8F8F8] outline-none placeholder:text-[#6b6b6b] placeholder:tracking-normal placeholder:font-medium focus:border-[#5a5a5a] disabled:opacity-60"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium tracking-wide text-[#C8C8C8] uppercase">
                  {categoryLabel(entry.category, entry.complete)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={pending || !entry.complete}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F8F8] px-3 py-1 text-[12px] font-semibold text-[#141414] disabled:opacity-40"
                >
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  {pending ? "Consultando…" : "Consultar"}
                </button>
              </div>
              {error || liveHint ? (
                <p className="mt-1.5 text-[11px] leading-snug text-[#f0a8a8]">{error || liveHint}</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
