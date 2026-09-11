"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BusinessType, OnboardingDraft } from "../../types";
import { BUSINESS_DESCRIPTION_MAX, BUSINESS_DESCRIPTION_MIN } from "../../types";

const BUSINESS_TYPES: { value: BusinessType; label: string; description: string }[] = [
  { value: "products", label: "Productos", description: "Vendes bienes físicos o digitales" },
  { value: "services", label: "Servicios", description: "Ofreces servicios profesionales" },
  { value: "both", label: "Ambos", description: "Combinas productos y servicios" },
];

type StepIdentityProps = {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
};

export function StepIdentity({ draft, onChange }: StepIdentityProps) {
  const identity = draft.identity ?? {
    business_name: "",
    business_type: "products" as BusinessType,
    description: "",
  };
  const charCount = identity.description?.length ?? 0;
  const atMin = charCount >= BUSINESS_DESCRIPTION_MIN;
  const atMax = charCount >= BUSINESS_DESCRIPTION_MAX;

  function handleDescriptionChange(value: string) {
    onChange({
      identity: {
        ...identity,
        description: value.slice(0, BUSINESS_DESCRIPTION_MAX),
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="business-name">Nombre del negocio</Label>
        <Input
          id="business-name"
          value={identity.business_name ?? ""}
          onChange={(e) =>
            onChange({
              identity: { ...identity, business_name: e.target.value },
            })
          }
          placeholder="Ej. The Wood Club"
          maxLength={120}
        />
      </div>

      <div className="space-y-3">
        <Label>Tipo de negocio</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {BUSINESS_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() =>
                onChange({ identity: { ...identity, business_type: type.value } })
              }
              className={cn(
                "rounded-xl border p-4 text-left transition-all duration-200 hover:border-[#7678ed]/50 hover:shadow-sm",
                identity.business_type === type.value
                  ? "border-[#7678ed] bg-[#7678ed]/5 ring-2 ring-[#7678ed]/20"
                  : "border-border bg-card"
              )}
            >
              <p className="text-sm font-semibold">{type.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="business-description">Descripción del negocio</Label>
          <span
            className={cn(
              "text-xs transition-colors",
              atMax
                ? "text-[#ff7a55]"
                : atMin
                  ? "text-emerald-600"
                  : "text-muted-foreground"
            )}
          >
            {charCount}/{BUSINESS_DESCRIPTION_MAX}
            {!atMin && ` (mín. ${BUSINESS_DESCRIPTION_MIN})`}
          </span>
        </div>
        <Textarea
          id="business-description"
          value={identity.description ?? ""}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          maxLength={BUSINESS_DESCRIPTION_MAX}
          placeholder="Ej. Panadería artesanal en Santiago con productos horneados todos los días. Especialistas en pan amasado y pasteles caseros."
          rows={5}
        />
        <p className="text-xs text-muted-foreground">
          Recomendado entre 300 y 600 caracteres. Máximo {BUSINESS_DESCRIPTION_MAX}.
        </p>
      </div>
    </div>
  );
}
