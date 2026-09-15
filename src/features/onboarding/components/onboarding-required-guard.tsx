"use client";

import { useCallback, useEffect, useState } from "react";
import { loadSetupStatusAction } from "@/lib/actions/app-actions";
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

  useEffect(() => {
    setLaterAt(readLaterAt(businessId));
    setHydrated(true);
  }, [businessId]);

  useEffect(() => {
    if (!hydrated || wizardOpen) return;

    let cancelled = false;
    const wait = msUntilPrompt(laterAt);
    const timeoutId = window.setTimeout(() => {
      void loadSetupStatusAction(businessId).then((result) => {
        if (cancelled) return;
        const completed = result.ok && Boolean(result.status.completed_at);
        if (completed && process.env.NODE_ENV !== "development") return;
        setPromptOpen(true);
      });
    }, wait);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [businessId, laterAt, hydrated, wizardOpen]);

  const handleLater = useCallback(() => {
    const at = Date.now();
    rememberLaterAt(businessId, at);
    setLaterAt(at);
    setPromptOpen(false);
  }, [businessId]);

  const handleStart = useCallback(() => {
    setPromptOpen(false);
    setWizardOpen(true);
  }, []);

  return (
    <>
      <OnboardingStartPrompt
        open={promptOpen}
        onOpenChange={setPromptOpen}
        onStart={handleStart}
        onLater={handleLater}
      />
      <OnboardingWizardDialog
        businessId={businessId}
        businessName={businessName}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />
    </>
  );
}
