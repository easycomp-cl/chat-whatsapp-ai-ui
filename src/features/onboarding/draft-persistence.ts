import type { OnboardingDraft, OnboardingPatch, SetupStatus } from "./types";
import { createEmptyDraft, mergeDraft, validateStep } from "./utils";
import { isPersistedLogoUrl } from "./logo-utils";
import {
  isDraftMeaningful,
  type OnboardingLocalSnapshot,
} from "./draft-storage";

export type HydratedOnboarding = {
  draft: OnboardingDraft;
  step: number;
  completedSteps: number[];
  progressPercent: number;
  source: "empty" | "local" | "server" | "merged";
};

function timestampMs(value?: string | null): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

export function inferCompletedSteps(draft: OnboardingDraft): number[] {
  const done: number[] = [];
  for (let step = 1; step <= 5; step += 1) {
    if (!validateStep(step, draft)) done.push(step);
  }
  return done;
}

export function inferProgressPercent(completedSteps: Iterable<number>): number {
  const unique = new Set(Array.from(completedSteps).filter((step) => step >= 1 && step <= 5));
  return Math.round((unique.size / 5) * 100);
}

function unionSteps(...groups: Array<Iterable<number> | undefined>): number[] {
  const unique = new Set<number>();
  for (const group of groups) {
    if (!group) continue;
    for (const step of group) {
      if (step >= 1 && step <= 5) unique.add(step);
    }
  }
  return Array.from(unique).sort((a, b) => a - b);
}

function sanitizeIdentityForRemote(draft: OnboardingDraft): OnboardingDraft["identity"] {
  const identity = { ...draft.identity };
  const logoUrl = identity?.logo_url;
  if (logoUrl && !isPersistedLogoUrl(logoUrl)) {
    identity.logo_url = undefined;
  }
  return identity;
}

/** PATCH de autosave: borrador parcial, sin data/blob del logo. */
export function buildAutosavePatch(draft: OnboardingDraft, step: number): OnboardingPatch {
  return {
    identity: sanitizeIdentityForRemote(draft),
    offerings: draft.offerings,
    operations: draft.operations,
    human_contact: draft.human_contact,
    bot_identity: draft.bot_identity,
    current_step: step,
  };
}

export function hydrateOnboardingDraft(options: {
  server?: SetupStatus | null;
  local?: OnboardingLocalSnapshot | null;
}): HydratedOnboarding {
  const serverDraft = options.server?.draft;
  const local = options.local;
  const hasServer = isDraftMeaningful(serverDraft);
  const hasLocal = isDraftMeaningful(local?.draft);

  if (!hasServer && !hasLocal) {
    return {
      draft: createEmptyDraft(),
      step: 1,
      completedSteps: [],
      progressPercent: 0,
      source: "empty",
    };
  }

  const serverMs = timestampMs(options.server?.draft_updated_at);
  const localMs = timestampMs(local?.savedAt);
  const localWins = !hasServer || (hasLocal && localMs >= serverMs);

  const older = localWins ? serverDraft : local?.draft;
  const newer = localWins ? local?.draft : serverDraft;
  let draft = createEmptyDraft();
  if (older) draft = mergeDraft(draft, older);
  if (newer) draft = mergeDraft(draft, newer);

  const completedSteps = unionSteps(
    inferCompletedSteps(draft),
    local?.completedSteps,
    options.server?.checklist
      ? Object.entries(options.server.checklist)
          .filter(([key, item]) =>
            ["identity", "offerings", "operations", "human_contact", "bot_identity"].includes(
              key
            ) && item.done
          )
          .map(([key]) => {
            const map: Record<string, number> = {
              identity: 1,
              offerings: 2,
              operations: 3,
              human_contact: 4,
              bot_identity: 5,
            };
            return map[key];
          })
      : undefined
  );

  const step = localWins
    ? (local?.step ?? options.server?.current_step ?? 1)
    : (options.server?.current_step ?? local?.step ?? 1);

  const progressPercent =
    options.server?.progress_percent && !localWins
      ? options.server.progress_percent
      : inferProgressPercent(completedSteps);

  return {
    draft,
    step: Math.min(5, Math.max(1, Number(step) || 1)),
    completedSteps,
    progressPercent,
    source: hasServer && hasLocal ? "merged" : hasLocal ? "local" : "server",
  };
}
