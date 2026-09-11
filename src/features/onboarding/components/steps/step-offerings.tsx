"use client";

import { OfferingListEditor } from "../offering-list-editor";
import type { OnboardingDraft } from "../../types";

type StepOfferingsProps = {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
};

export function StepOfferings({ draft, onChange }: StepOfferingsProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Agrega entre 1 y 5 productos o servicios principales. Tu bot usará esta información
        para responder consultas de clientes.
      </p>
      <OfferingListEditor
        value={draft.offerings ?? []}
        onChange={(offerings) => onChange({ offerings })}
        businessType={draft.identity?.business_type ?? "products"}
      />
    </div>
  );
}
