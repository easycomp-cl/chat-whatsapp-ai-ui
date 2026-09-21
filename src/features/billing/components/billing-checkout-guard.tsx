"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadSetupStatusAction } from "@/lib/actions/app-actions";
import { WHATSAPP_ONBOARDING_PATH } from "@/lib/meta/embedded-signup";
import { isNeedsBillingCheckout } from "@/lib/billing/pending-selection";
import { PlanCheckoutModal } from "./plan-checkout-modal";

type BillingCheckoutGuardProps = {
  businessId: string;
  whatsappConnected: boolean;
};

export function BillingCheckoutGuard({
  businessId,
  whatsappConnected,
}: BillingCheckoutGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [planOpen, setPlanOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const needsBilling = await isNeedsBillingCheckout();
      if (cancelled || !needsBilling) return;

      const setup = await loadSetupStatusAction(businessId);
      if (cancelled) return;
      const onboardingDone = setup.ok && Boolean(setup.status.completed_at);
      if (!onboardingDone) return;

      if (!whatsappConnected) {
        if (!pathname.startsWith("/onboarding/whatsapp")) {
          router.replace(WHATSAPP_ONBOARDING_PATH);
        }
        return;
      }

      setPlanOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId, pathname, router, whatsappConnected]);

  return (
    <PlanCheckoutModal
      open={planOpen}
      onOpenChange={setPlanOpen}
      required
    />
  );
}
