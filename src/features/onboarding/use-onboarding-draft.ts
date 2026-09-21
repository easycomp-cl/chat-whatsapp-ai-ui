"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadSetupStatusAction,
  patchOnboardingAction,
} from "@/lib/actions/app-actions";
import type { OnboardingDraft } from "./types";
import { createEmptyDraft, mergeDraft } from "./utils";
import {
  clearOnboardingSnapshot,
  isDraftMeaningful,
  readOnboardingSnapshot,
  writeOnboardingSnapshot,
} from "./draft-storage";
import {
  buildAutosavePatch,
  hydrateOnboardingDraft,
  inferCompletedSteps,
  inferProgressPercent,
} from "./draft-persistence";

export type OnboardingPersistStatus =
  | "idle"
  | "saving"
  | "saved-local"
  | "synced"
  | "offline";

const REMOTE_DEBOUNCE_MS = 800;

type PersistMeta = {
  step: number;
  completedSteps: number[];
  progressPercent: number;
};

export function useOnboardingDraft(businessId: string, open: boolean) {
  const [draft, setDraft] = useState<OnboardingDraft>(createEmptyDraft);
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => new Set());
  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [persistStatus, setPersistStatus] = useState<OnboardingPersistStatus>("idle");

  const draftRef = useRef(draft);
  const stepRef = useRef(step);
  const completedRef = useRef(completedSteps);
  const progressRef = useRef(progressPercent);
  const dirtyRef = useRef(false);
  const remoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteInFlightRef = useRef(false);
  const queuedRemoteRef = useRef(false);
  const openRef = useRef(open);
  const readyRef = useRef(false);

  draftRef.current = draft;
  stepRef.current = step;
  completedRef.current = completedSteps;
  progressRef.current = progressPercent;
  openRef.current = open;

  const persistLocal = useCallback(
    (next?: Partial<PersistMeta> & { draft?: OnboardingDraft }) => {
      return writeOnboardingSnapshot(businessId, {
        draft: next?.draft ?? draftRef.current,
        step: next?.step ?? stepRef.current,
        completedSteps: next?.completedSteps ?? Array.from(completedRef.current),
        progressPercent: next?.progressPercent ?? progressRef.current,
      });
    },
    [businessId]
  );

  const flushRemote = useCallback(async () => {
    if (!readyRef.current) return;
    if (!isDraftMeaningful(draftRef.current)) return;
    if (remoteInFlightRef.current) {
      queuedRemoteRef.current = true;
      return;
    }
    remoteInFlightRef.current = true;
    setPersistStatus("saving");
    const patch = buildAutosavePatch(draftRef.current, stepRef.current);
    try {
      const result = await patchOnboardingAction(businessId, patch);
      if (!openRef.current) return;
      if (result.ok) {
        setApiAvailable(true);
        if (typeof result.status.progress_percent === "number") {
          setProgressPercent(result.status.progress_percent);
          progressRef.current = result.status.progress_percent;
        }
        setPersistStatus("synced");
      } else {
        setApiAvailable(false);
        setPersistStatus("offline");
      }
    } catch {
      if (!openRef.current) return;
      setApiAvailable(false);
      setPersistStatus("offline");
    } finally {
      remoteInFlightRef.current = false;
      if (queuedRemoteRef.current && openRef.current) {
        queuedRemoteRef.current = false;
        void flushRemote();
      }
    }
  }, [businessId]);

  const scheduleRemote = useCallback(() => {
    if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
    remoteTimerRef.current = setTimeout(() => {
      remoteTimerRef.current = null;
      void flushRemote();
    }, REMOTE_DEBOUNCE_MS);
  }, [flushRemote]);

  const load = useCallback(async () => {
    dirtyRef.current = false;
    readyRef.current = false;
    setLoading(true);
    const local = readOnboardingSnapshot(businessId);
    if (local) {
      const hydratedLocal = hydrateOnboardingDraft({ local });
      draftRef.current = hydratedLocal.draft;
      stepRef.current = hydratedLocal.step;
      completedRef.current = new Set(hydratedLocal.completedSteps);
      progressRef.current = hydratedLocal.progressPercent;
      setDraft(hydratedLocal.draft);
      setStep(hydratedLocal.step);
      setCompletedSteps(new Set(hydratedLocal.completedSteps));
      setProgressPercent(hydratedLocal.progressPercent);
      setPersistStatus("saved-local");
      readyRef.current = true;
      setLoading(false);
    }

    try {
      const result = await loadSetupStatusAction(businessId);
      if (!openRef.current) return;
      if (!result.ok) {
        setApiAvailable(false);
        if (!local) {
          const empty = createEmptyDraft();
          draftRef.current = empty;
          stepRef.current = 1;
          completedRef.current = new Set();
          progressRef.current = 0;
          setDraft(empty);
          setStep(1);
          setCompletedSteps(new Set());
          setProgressPercent(0);
        }
        setPersistStatus(local ? "offline" : "idle");
        return;
      }

      setApiAvailable(true);
      if (dirtyRef.current) {
        void flushRemote();
        return;
      }

      const hydrated = hydrateOnboardingDraft({
        server: result.status,
        local: readOnboardingSnapshot(businessId),
      });
      draftRef.current = hydrated.draft;
      stepRef.current = hydrated.step;
      completedRef.current = new Set(hydrated.completedSteps);
      progressRef.current = hydrated.progressPercent;
      setDraft(hydrated.draft);
      setStep(hydrated.step);
      setCompletedSteps(new Set(hydrated.completedSteps));
      setProgressPercent(hydrated.progressPercent);
      persistLocal({
        draft: hydrated.draft,
        step: hydrated.step,
        completedSteps: hydrated.completedSteps,
        progressPercent: hydrated.progressPercent,
      });
      setPersistStatus(hydrated.source === "local" || hydrated.source === "merged" ? "saved-local" : "synced");
    } finally {
      readyRef.current = true;
      if (openRef.current) setLoading(false);
    }
  }, [businessId, persistLocal, flushRemote]);

  useEffect(() => {
    if (!open) return;
    void load();
    return () => {
      if (remoteTimerRef.current) {
        clearTimeout(remoteTimerRef.current);
        remoteTimerRef.current = null;
      }
    };
  }, [open, load]);

  useEffect(() => {
    if (!open) return;

    function flush() {
      persistLocal();
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        flush();
        void flushRemote();
      }
    }

    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [open, persistLocal, flushRemote]);

  function updateDraft(patch: Partial<OnboardingDraft>) {
    dirtyRef.current = true;
    setDraft((prev) => {
      const next = mergeDraft(prev, patch);
      draftRef.current = next;
      persistLocal({ draft: next });
      return next;
    });
    setPersistStatus("saving");
    scheduleRemote();
  }

  function rememberStep(nextStep: number) {
    stepRef.current = nextStep;
    setStep(nextStep);
    persistLocal({ step: nextStep });
    scheduleRemote();
  }

  function markStepCompleted(stepId: number, progress?: number) {
    const nextCompleted = new Set(completedRef.current);
    nextCompleted.add(stepId);
    const inferred = inferCompletedSteps(draftRef.current);
    for (const id of inferred) nextCompleted.add(id);
    const percent = progress ?? inferProgressPercent(nextCompleted);
    completedRef.current = nextCompleted;
    progressRef.current = percent;
    setCompletedSteps(nextCompleted);
    setProgressPercent(percent);
    persistLocal({
      completedSteps: Array.from(nextCompleted),
      progressPercent: percent,
    });
  }

  function replaceDraft(next: OnboardingDraft) {
    dirtyRef.current = true;
    draftRef.current = next;
    setDraft(next);
    persistLocal({ draft: next });
  }

  function clearPersistedDraft() {
    clearOnboardingSnapshot(businessId);
    setPersistStatus("idle");
  }

  return {
    draft,
    step,
    completedSteps,
    progressPercent,
    loading,
    apiAvailable,
    persistStatus,
    updateDraft,
    rememberStep,
    markStepCompleted,
    replaceDraft,
    persistLocal,
    flushRemote,
    clearPersistedDraft,
    setApiAvailable,
    setProgressPercent,
  };
}
