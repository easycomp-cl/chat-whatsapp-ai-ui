import { STORAGE_PREFIX } from "@/lib/brand/constants";
import { createClient } from "@/lib/supabase/client";
import {
  parseBillingDay,
  parsePlanId,
  type PendingBillingSelection,
} from "@/lib/billing/plans";

export const PENDING_BILLING_STORAGE_KEY = `${STORAGE_PREFIX}:pending-billing`;
export const NEEDS_BILLING_STORAGE_KEY = `${STORAGE_PREFIX}:needs-billing-checkout`;

export function markNeedsBillingCheckout(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NEEDS_BILLING_STORAGE_KEY, userId);
}

export function clearNeedsBillingCheckout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(NEEDS_BILLING_STORAGE_KEY);
}

export function isNeedsBillingCheckoutForUser(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NEEDS_BILLING_STORAGE_KEY) === userId;
}

export async function isNeedsBillingCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return false;
  if (user.user_metadata?.needs_billing === true) {
    markNeedsBillingCheckout(user.id);
    return true;
  }
  return isNeedsBillingCheckoutForUser(user.id);
}

export function savePendingBillingSelection(selection: PendingBillingSelection): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_BILLING_STORAGE_KEY, JSON.stringify(selection));
}

export function readPendingBillingSelection(): PendingBillingSelection | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_BILLING_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { planId?: unknown; billingDay?: unknown };
    const planId = parsePlanId(typeof parsed.planId === "string" ? parsed.planId : null);
    const billingDay = parseBillingDay(parsed.billingDay);
    if (!planId || billingDay == null) return null;
    return { planId, billingDay };
  } catch {
    return null;
  }
}

export function clearPendingBillingSelection(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_BILLING_STORAGE_KEY);
}
