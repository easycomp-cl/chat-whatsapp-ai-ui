"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CHILE_REGION_NAMES,
  getCommunesForRegion,
} from "@/lib/delivery/chile-locations";
import type { OnboardingDraft } from "../../types";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_OPTIONS } from "../../types";
import { BusinessSchedulePicker } from "../business-schedule-picker";

type StepOperationsProps = {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
  scheduleError?: string | null;
};

const PAYMENT_LABELS = PAYMENT_METHOD_LABELS;

export function StepOperations({
  draft,
  onChange,
  scheduleError,
}: StepOperationsProps) {
  const operations = draft.operations ?? { schedule: "", payment_methods: [] };
  const methods = operations.payment_methods ?? [];
  const region = operations.region ?? operations.city ?? "";
  const commune = operations.commune ?? "";

  const communes = useMemo(
    () => (region ? getCommunesForRegion(region) : []),
    [region]
  );

  function updateOperations(patch: Partial<NonNullable<OnboardingDraft["operations"]>>) {
    onChange({ operations: { ...operations, ...patch } });
  }

  function togglePayment(method: string) {
    const next = methods.includes(method)
      ? methods.filter((m) => m !== method)
      : [...methods, method];
    updateOperations({ payment_methods: next });
  }

  function handleRegionChange(nextRegion: string | null) {
    if (!nextRegion) return;
    updateOperations({
      region: nextRegion,
      city: nextRegion,
      commune: "",
    });
  }

  return (
    <div className="space-y-5">
      <BusinessSchedulePicker
        value={operations.schedule ?? ""}
        onChange={(schedule) => updateOperations({ schedule })}
        error={scheduleError}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="region">Región</Label>
          <Select value={region || null} onValueChange={handleRegionChange}>
            <SelectTrigger id="region" className="w-full">
              <SelectValue placeholder="Selecciona una región" />
            </SelectTrigger>
            <SelectContent positionerClassName="z-[60]">
              {CHILE_REGION_NAMES.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="commune">Comuna</Label>
          <Select
            value={commune || null}
            onValueChange={(value) => updateOperations({ commune: value ?? "" })}
            disabled={!region}
          >
            <SelectTrigger id="commune" className="w-full" disabled={!region}>
              <SelectValue
                placeholder={region ? "Selecciona una comuna" : "Primero elige una región"}
              />
            </SelectTrigger>
            <SelectContent positionerClassName="z-[60]">
              {communes.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección (opcional)</Label>
        <Input
          id="address"
          value={operations.address ?? ""}
          onChange={(e) => updateOperations({ address: e.target.value })}
          placeholder="Av. Providencia 1234"
        />
      </div>

      <div className="space-y-3">
        <div>
          <Label>Medios de pago</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Puedes seleccionar más de uno.
          </p>
        </div>
        <div className="space-y-2">
          {PAYMENT_METHOD_OPTIONS.map((method) => {
            const selected = methods.includes(method);
            return (
              <button
                key={method}
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => togglePayment(method)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors duration-200",
                  selected
                    ? "border-[#7678ed] bg-[#7678ed]/5"
                    : "border-transparent bg-card ring-1 ring-border hover:border-[#7678ed]/30"
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border transition-colors duration-200",
                    selected
                      ? "border-[#7678ed] bg-[#7678ed] text-white"
                      : "border-input bg-background"
                  )}
                >
                  {selected && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="text-sm font-medium">{PAYMENT_LABELS[method]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery-notes">Notas de despacho (opcional)</Label>
        <Textarea
          id="delivery-notes"
          value={operations.delivery_notes ?? ""}
          onChange={(e) => updateOperations({ delivery_notes: e.target.value })}
          placeholder="Ej. Despacho en RM, retiro en tienda"
          rows={2}
        />
      </div>
    </div>
  );
}
