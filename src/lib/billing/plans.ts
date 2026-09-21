export const BILLING_DAYS = [5, 15, 30] as const;

export type BillingDay = (typeof BILLING_DAYS)[number];

export type PlanId = "easycomp_starter" | "easycomp_pro" | "easycomp_business";

export type BillingPlanPromo = {
  amountNet: number;
  amountIva: number;
  amountTotal: number;
  months: number;
};

export type BillingPlan = {
  id: PlanId;
  name: string;
  tagline: string;
  recommended: boolean;
  amountNet: number;
  amountIva: number;
  amountTotal: number;
  promo?: BillingPlanPromo;
  icon: "store" | "users" | "building";
};

export const BILLING_IVA_RATE = 0.19;

export const BILLING_PLANS: readonly BillingPlan[] = [
  {
    id: "easycomp_starter",
    name: "Starter",
    tagline: "Para 1 local",
    recommended: false,
    amountNet: 99990,
    amountIva: 18998,
    amountTotal: 118988,
    promo: {
      amountNet: 79990,
      amountIva: 15198,
      amountTotal: 95188,
      months: 3,
    },
    icon: "store",
  },
  {
    id: "easycomp_pro",
    name: "Pro",
    tagline: "Para 1 local con más equipo y más pedidos",
    recommended: true,
    amountNet: 149990,
    amountIva: 28498,
    amountTotal: 178488,
    icon: "users",
  },
  {
    id: "easycomp_business",
    name: "Business",
    tagline: "Para cadena o varios puntos",
    recommended: false,
    amountNet: 249990,
    amountIva: 47498,
    amountTotal: 297488,
    icon: "building",
  },
] as const;

export const DEFAULT_PLAN_ID: PlanId = "easycomp_pro";

export type PendingBillingSelection = {
  planId: PlanId;
  billingDay: BillingDay;
};

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatPlanPrice(amount: number): string {
  return CLP.format(Math.round(amount));
}

export function isPlanId(value: string | null | undefined): value is PlanId {
  return BILLING_PLANS.some((plan) => plan.id === value);
}

export function isBillingDay(value: number): value is BillingDay {
  return (BILLING_DAYS as readonly number[]).includes(value);
}

export function parsePlanId(value: string | null | undefined): PlanId | null {
  return isPlanId(value) ? value : null;
}

export function parseBillingDay(value: unknown): BillingDay | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n)) return null;
  return isBillingDay(n) ? n : null;
}

export function getPlanById(id: PlanId): BillingPlan {
  const plan = BILLING_PLANS.find((item) => item.id === id);
  if (!plan) throw new Error(`Plan desconocido: ${id}`);
  return plan;
}

export function planHasPromo(plan: BillingPlan): plan is BillingPlan & { promo: BillingPlanPromo } {
  return plan.promo != null;
}

/** Neto que se cobra hoy (oferta si está vigente en el catálogo). */
export function planCurrentNet(plan: BillingPlan): number {
  return plan.promo?.amountNet ?? plan.amountNet;
}

/** Total con IVA que se cobra hoy. */
export function planCurrentTotal(plan: BillingPlan): number {
  return plan.promo?.amountTotal ?? plan.amountTotal;
}
