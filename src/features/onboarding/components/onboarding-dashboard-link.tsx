"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isNeedsBillingCheckout } from "@/lib/billing/pending-selection";

export function OnboardingDashboardLink() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    void isNeedsBillingCheckout().then((needs) => {
      setVisible(!needs);
    });
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/app/dashboard"
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Ir al dashboard
    </Link>
  );
}
