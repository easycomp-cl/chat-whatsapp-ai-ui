"use client";

import { Bike, Car, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  formatPlateDisplay,
  formatPlateEntry,
  parseVehicleCardBodyText,
  plateCategoryFromType,
  vehicleFactRows,
  type PlateCategory,
} from "@/lib/customers/vehicle";
import type { SystemEvent } from "@/types/message";

function payloadText(payload: Record<string, unknown> | undefined, key: string): string {
  const value = payload?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function payloadYear(payload: Record<string, unknown> | undefined): string | number | null {
  const value = payload?.year;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function firstText(...values: Array<string | number | null | undefined>): string {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

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

export function ChatVehicleCard({ event }: { event: SystemEvent }) {
  const body = event.body.trim();
  const payload = event.payload;
  const fromBody = parseVehicleCardBodyText(body);

  const plate = firstText(
    payloadText(payload, "plate_display"),
    payloadText(payload, "plate") ? formatPlateDisplay(payloadText(payload, "plate")) : "",
    fromBody.plateDisplay,
    fromBody.plate ? formatPlateDisplay(fromBody.plate) : ""
  );
  const make = firstText(payloadText(payload, "make"), fromBody.make);
  const model = firstText(payloadText(payload, "model"), fromBody.model);
  const year = firstText(payloadYear(payload), fromBody.year);
  const version = firstText(payloadText(payload, "version"), fromBody.version);
  const color = firstText(payloadText(payload, "color"), fromBody.color);
  const fuel = firstText(payloadText(payload, "fuel"), fromBody.fuel);
  const transmission = firstText(payloadText(payload, "transmission"), fromBody.transmission);
  const engine = firstText(payloadText(payload, "engine"), fromBody.engine);
  const vin = firstText(payloadText(payload, "vin"), fromBody.vin);
  const vehicleType = firstText(payloadText(payload, "vehicle_type"), fromBody.vehicleType);

  const facts = vehicleFactRows({
    plateDisplay: plate,
    make,
    model,
    year,
    version,
    color,
    fuel,
    transmission,
    engine,
    vin,
    vehicleType,
  }).filter((row) => row.label !== "Patente");

  const category: PlateCategory | null =
    formatPlateEntry(payloadText(payload, "plate") || fromBody.plate || plate).category ??
    plateCategoryFromType(vehicleType) ??
    "auto";

  return (
    <div className="flex justify-center px-3 py-1.5">
      <div className="flex w-full max-w-[340px] items-start gap-3 rounded-2xl border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-[#F8F8F8] shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2A2A2A]">
          {category === "moto" ? (
            <Bike className="size-4 text-[#F8F8F8]" strokeWidth={2} />
          ) : (
            <Car className="size-4 text-[#F8F8F8]" strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-semibold tracking-wide text-[#C8C8C8] uppercase">
                {category === "moto" ? "Moto" : "Auto"}
              </p>
              <PrivateNoteHint />
            </div>
            {plate ? <p className="text-[13px] font-semibold tracking-wide">{plate}</p> : null}
          </div>
          {facts.length > 0 ? (
            <dl className="mt-2 space-y-1 border-t border-[#2A2A2A] pt-2">
              {facts.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3 text-[12px] leading-snug">
                  <dt className="shrink-0 text-[#8d8d8d]">{row.label}</dt>
                  <dd className="text-right wrap-anywhere text-[#F8F8F8]">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : body ? (
            <p className="mt-2 text-[13px] leading-[1.35] wrap-anywhere text-[#C8C8C8]">{body}</p>
          ) : (
            <p className="mt-2 text-[13px] text-[#C8C8C8]">Sin datos del vehículo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
