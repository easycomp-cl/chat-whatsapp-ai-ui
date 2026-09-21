"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_PLAN_ID, type BillingDay, type PlanId } from "@/lib/billing/plans";
import {
  clearNeedsBillingCheckout,
  savePendingBillingSelection,
} from "@/lib/billing/pending-selection";
import { PlanSelectModal } from "./plan-select-modal";

type PlanCheckoutModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  required?: boolean;
};

export function PlanCheckoutModal({
  open,
  onOpenChange,
  required = true,
}: PlanCheckoutModalProps) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(DEFAULT_PLAN_ID);
  const [billingDay, setBillingDay] = useState<BillingDay | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    if (billingDay == null) return;
    setConfirming(true);
    const selection = { planId: selectedPlanId, billingDay };

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          plan_id: selection.planId,
          billing_day: selection.billingDay,
          needs_billing: false,
        },
      });
      if (error) throw error;
      savePendingBillingSelection(selection);
      clearNeedsBillingCheckout();
      toast.success("Plan elegido", {
        description: "El cobro con Flow se completa cuando el checkout esté activo.",
      });
      onOpenChange(false);
      router.push("/app/dashboard");
      router.refresh();
    } catch {
      toast.error("No se pudo guardar el plan. Inténtalo de nuevo.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <PlanSelectModal
      open={open}
      onOpenChange={onOpenChange}
      selectedPlanId={selectedPlanId}
      billingDay={billingDay}
      onSelectPlan={setSelectedPlanId}
      onSelectBillingDay={setBillingDay}
      onConfirm={() => void handleConfirm()}
      confirming={confirming}
      confirmLabel="Confirmar plan"
      required={required}
    />
  );
}
