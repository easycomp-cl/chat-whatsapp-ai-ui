"use client";

import { Building2, Store, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  BILLING_DAYS,
  BILLING_PLANS,
  formatPlanPrice,
  type BillingDay,
  type BillingPlan,
  type PlanId,
} from "@/lib/billing/plans";

const PLAN_ICONS = {
  store: Store,
  users: Users,
  building: Building2,
} as const;

type PlanSelectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlanId: PlanId | null;
  billingDay: BillingDay | null;
  onSelectPlan: (planId: PlanId) => void;
  onSelectBillingDay: (day: BillingDay) => void;
  onConfirm: () => void;
  confirming?: boolean;
  confirmLabel?: string;
  /** Si true, no se puede cerrar hasta elegir plan. */
  required?: boolean;
};

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: BillingPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = PLAN_ICONS[plan.icon];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={
        plan.promo
          ? `${plan.name}. ${plan.tagline}. Precio de lista ${formatPlanPrice(plan.amountNet)}, oferta ${formatPlanPrice(plan.promo.amountNet)} más IVA al mes por ${plan.promo.months} meses`
          : `${plan.name}. ${plan.tagline}. ${formatPlanPrice(plan.amountNet)} más IVA al mes`
      }
      onClick={onSelect}
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-card p-4 text-left transition-all",
        "hover:border-primary/40 hover:bg-muted/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-xl",
            selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="flex flex-wrap justify-end gap-1">
          {plan.promo ? (
            <Badge className="bg-amber-500 text-white">Oferta {plan.promo.months} meses</Badge>
          ) : null}
          {plan.recommended ? (
            <Badge className="bg-emerald-600 text-white">Recomendado</Badge>
          ) : null}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">{plan.name}</h3>
      <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.tagline}</p>
      {plan.promo ? (
        <div className="mt-4 space-y-1">
          <p className="text-sm text-muted-foreground">
            <span className="line-through">{formatPlanPrice(plan.amountNet)}</span>
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {formatPlanPrice(plan.promo.amountNet)}
          </p>
          <p className="text-xs text-muted-foreground">
            + IVA / mes · oferta por {plan.promo.months} meses, luego{" "}
            {formatPlanPrice(plan.amountNet)}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-2xl font-bold tracking-tight">
            {formatPlanPrice(plan.amountNet)}
          </p>
          <p className="text-xs text-muted-foreground">+ IVA / mes</p>
        </>
      )}
    </button>
  );
}

export function PlanSelectModal({
  open,
  onOpenChange,
  selectedPlanId,
  billingDay,
  onSelectPlan,
  onSelectBillingDay,
  onConfirm,
  confirming = false,
  confirmLabel = "Continuar",
  required = false,
}: PlanSelectModalProps) {
  const canConfirm = selectedPlanId != null && billingDay != null && !confirming;

  return (
    <Dialog
      open={open}
      disablePointerDismissal={required}
      onOpenChange={(next) => {
        if (!next && required) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="flex max-h-[min(90vh,48rem)] w-full flex-col gap-4 overflow-hidden sm:max-w-4xl"
        showCloseButton={!required}
      >
        <DialogHeader>
          <DialogTitle>Elige tu plan</DialogTitle>
          <DialogDescription>
            El día de cobro se fija al contratar y no se puede cambiar después.
            El primer mes se prorratea hasta esa fecha.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div
            role="radiogroup"
            aria-label="Planes disponibles"
            className="grid gap-3 sm:grid-cols-3"
          >
            {BILLING_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlanId === plan.id}
                onSelect={() => onSelectPlan(plan.id)}
              />
            ))}
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-t pt-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">¿Qué día del mes quieres pagar?</p>
            <div
              role="radiogroup"
              aria-label="Día de cobro"
              className="grid grid-cols-3 gap-2"
            >
              {BILLING_DAYS.map((day) => {
                const selected = billingDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onSelectBillingDay(day)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    Los {day}
                  </button>
                );
              })}
            </div>
            {billingDay != null ? (
              <p className="text-xs text-muted-foreground">
                Cobramos los días {billingDay} de cada mes. Si el mes no tiene ese
                día, se usa el último día del mes.
              </p>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            El pago con tarjeta lo procesa Flow. No guardamos los datos de tu tarjeta.
          </p>
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {confirming ? "Guardando…" : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
