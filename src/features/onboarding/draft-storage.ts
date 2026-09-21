import type { OnboardingDraft } from "./types";
import { isStorableLogoUrl } from "./logo-utils";

export const ONBOARDING_DRAFT_STORAGE_VERSION = 1 as const;

export type OnboardingLocalSnapshot = {
  version: typeof ONBOARDING_DRAFT_STORAGE_VERSION;
  businessId: string;
  savedAt: string;
  step: number;
  completedSteps: number[];
  progressPercent: number;
  draft: OnboardingDraft;
};

const MAX_LOGO_CHARS = 1_200_000;

function storageKey(businessId: string) {
  return `onboarding-draft:v${ONBOARDING_DRAFT_STORAGE_VERSION}:${businessId}`;
}

export function sanitizeDraftForStorage(draft: OnboardingDraft): OnboardingDraft {
  const logoUrl = draft.identity?.logo_url;
  const keepLogo =
    isStorableLogoUrl(logoUrl) && logoUrl.length <= MAX_LOGO_CHARS ? logoUrl : null;

  return {
    ...draft,
    identity: {
      ...draft.identity,
      logo_url: keepLogo,
    },
  };
}

export function isDraftMeaningful(draft: OnboardingDraft | null | undefined): boolean {
  if (!draft) return false;
  if (draft.identity?.business_name?.trim()) return true;
  if (draft.identity?.description?.trim()) return true;
  if (isStorableLogoUrl(draft.identity?.logo_url)) return true;
  if (draft.offerings?.some((item) => item.name.trim() || item.description.trim())) {
    return true;
  }
  if (draft.operations?.schedule?.trim()) return true;
  if (draft.operations?.payment_methods?.length) return true;
  if (draft.operations?.address?.trim() || draft.operations?.commune?.trim()) return true;
  if (draft.human_contact?.admin_name?.trim() || draft.human_contact?.admin_phone?.trim()) {
    return true;
  }
  if (draft.bot_identity?.bot_name?.trim() || draft.bot_identity?.greeting_message?.trim()) {
    return true;
  }
  return false;
}

function clampStep(step: unknown): number {
  const value = typeof step === "number" ? step : Number(step);
  if (!Number.isInteger(value)) return 1;
  return Math.min(5, Math.max(1, value));
}

export function readOnboardingSnapshot(businessId: string): OnboardingLocalSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(businessId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingLocalSnapshot;
    if (!parsed || parsed.businessId !== businessId) return null;
    if (parsed.version !== ONBOARDING_DRAFT_STORAGE_VERSION) return null;
    if (!parsed.draft || typeof parsed.savedAt !== "string") return null;
    return {
      ...parsed,
      step: clampStep(parsed.step),
      completedSteps: Array.isArray(parsed.completedSteps)
        ? parsed.completedSteps.filter((id) => id >= 1 && id <= 5)
        : [],
      progressPercent:
        typeof parsed.progressPercent === "number" ? parsed.progressPercent : 0,
      draft: sanitizeDraftForStorage(parsed.draft),
    };
  } catch {
    return null;
  }
}

export function writeOnboardingSnapshot(
  businessId: string,
  snapshot: Omit<OnboardingLocalSnapshot, "version" | "businessId" | "savedAt" | "draft"> & {
    draft: OnboardingDraft;
  }
): OnboardingLocalSnapshot | null {
  if (typeof window === "undefined") return null;

  const payload: OnboardingLocalSnapshot = {
    version: ONBOARDING_DRAFT_STORAGE_VERSION,
    businessId,
    savedAt: new Date().toISOString(),
    step: clampStep(snapshot.step),
    completedSteps: snapshot.completedSteps,
    progressPercent: snapshot.progressPercent,
    draft: sanitizeDraftForStorage(snapshot.draft),
  };

  const serialized = JSON.stringify(payload);
  try {
    localStorage.setItem(storageKey(businessId), serialized);
    return payload;
  } catch {
    const withoutLogo: OnboardingLocalSnapshot = {
      ...payload,
      draft: {
        ...payload.draft,
        identity: { ...payload.draft.identity, logo_url: null },
      },
    };
    try {
      localStorage.setItem(storageKey(businessId), JSON.stringify(withoutLogo));
      return withoutLogo;
    } catch {
      return null;
    }
  }
}

export function clearOnboardingSnapshot(businessId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(businessId));
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasOnboardingSnapshot(businessId: string): boolean {
  const snapshot = readOnboardingSnapshot(businessId);
  return isDraftMeaningful(snapshot?.draft);
}
