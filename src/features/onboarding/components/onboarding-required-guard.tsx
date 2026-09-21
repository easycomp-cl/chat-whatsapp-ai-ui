"use client";

import { useCallback, useEffect, useState } from "react";
import { loadSetupStatusAction } from "@/lib/actions/app-actions";
import { hasOnboardingSnapshot } from "../draft-storage";
import { isNeedsBillingCheckout } from "@/lib/billing/pending-selection";
import { OnboardingStartPrompt } from "./onboarding-start-prompt";
import { OnboardingWizardDialog } from "./onboarding-wizard-dialog";

type OnboardingRequiredGuardProps = {
  businessId: string;
  businessName: string;
};

const LATER_COOLDOWN_MS = 60 * 60 * 1000;

function laterStorageKey(businessId: string) {
  return `onboarding-start-later-at:${businessId}`;
}

function readLaterAt(businessId: string): number | null {
  try {
    const raw = localStorage.getItem(laterStorageKey(businessId));
    if (!raw) return null;
    const at = Number(raw);
    return Number.isFinite(at) ? at : null;
  } catch {
    return null;
  }
}

function rememberLaterAt(businessId: string, at: number) {
  try {
    localStorage.setItem(laterStorageKey(businessId), String(at));
  } catch {
    /* ignore quota / private mode */
  }
}

function msUntilPrompt(laterAt: number | null): number {
  if (laterAt == null) return 0;
  return Math.max(0, laterAt + LATER_COOLDOWN_MS - Date.now());
}

export function OnboardingRequiredGuard({
  businessId,
  businessName,
}: OnboardingRequiredGuardProps) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [laterAt, setLaterAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [billingChecked, setBillingChecked] = useState(false);
  const [forceBillingFunnel, setForceBillingFunnel] = useState(false);

  useEffect(() => {
    setLaterAt(readLaterAt(businessId));
    setHasDraft(hasOnboardingSnapshot(businessId));
    setHydrated(true);
    void isNeedsBillingCheckout().then((needs) => {
      setForceBillingFunnel(needs);
      setBillingChecked(true);
    });
  }, [businessId]);

  useEffect(() => {
    if (!hydrated || !billingChecked || wizardOpen) return;

    let cancelled = false;
    let timeoutId: number | undefined;

    void loadSetupStatusAction(businessId).then((result) => {
      if (cancelled) return;
      const completed = result.ok && Boolean(result.status.completed_at);

      if (forceBillingFunnel) {
        if (!completed) {
          setPromptOpen(false);
          setWizardOpen(true);
        }
        return;
      }

      if (completed && process.env.NODE_ENV !== "development") return;

      const wait = msUntilPrompt(laterAt);
      timeoutId = window.setTimeout(() => {
        if (!cancelled) setPromptOpen(true);
      }, wait);
    });

    return () => {
      cancelled = true;
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [businessId, laterAt, hydrated, billingChecked, forceBillingFunnel, wizardOpen]);

  const handleLater = useCallback(() => {
    if (forceBillingFunnel) return;
    const at = Date.now();
    rememberLaterAt(businessId, at);
    setLaterAt(at);
    setPromptOpen(false);
  }, [businessId, forceBillingFunnel]);

  const handleStart = useCallback(() => {
    setHasDraft(hasOnboardingSnapshot(businessId));
    setPromptOpen(false);
    setWizardOpen(true);
  }, [businessId]);

  return (
    <>
      <OnboardingStartPrompt
        open={promptOpen}
        onOpenChange={setPromptOpen}
        onStart={handleStart}
        onLater={handleLater}
        hasDraft={hasDraft}
      />
      <OnboardingWizardDialog
        businessId={businessId}
        businessName={businessName}
        open={wizardOpen}
        required={forceBillingFunnel}
        onOpenChange={(next) => {
          setWizardOpen(next);
          if (!next) setHasDraft(hasOnboardingSnapshot(businessId));
        }}
      />
    </>
  );
}
