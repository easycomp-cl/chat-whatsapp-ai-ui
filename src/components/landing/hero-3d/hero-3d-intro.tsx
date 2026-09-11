"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INTRO_TIMELINE } from "./hero-3d.config";
import type { NodeKey } from "./hero-3d.types";

/** Start time (seconds, relative to intro) for each conversation node. */
export const NODE_INTRO_STARTS: Record<NodeKey, number> = {
  incoming: INTRO_TIMELINE.incoming,
  intent: INTRO_TIMELINE.intent,
  knowledge: INTRO_TIMELINE.knowledge,
  response: INTRO_TIMELINE.response,
  handoff: INTRO_TIMELINE.handoff,
  inbox: INTRO_TIMELINE.inbox,
};

/** Smooth 0–1 easing with no overshoot — cinematic, never bouncy. */
export function introFactor(
  elapsed: number,
  start: number,
  duration = 0.5
): number {
  return THREE.MathUtils.smoothstep((elapsed - start) / duration, 0, 1);
}

type IntroClockContextValue = {
  /** Seconds elapsed since the intro started; updated every rAF via ref only. */
  elapsedRef: RefObject<number>;
  reducedMotion: boolean;
};

const IntroClockContext = createContext<IntroClockContextValue | null>(null);

/**
 * Drives the whole intro/idle timeline from a single ref updated every
 * animation frame — no React state, so every consumer animates at full
 * frame rate with zero reconciliation overhead ("más fluidas").
 */
export function IntroClockProvider({
  reducedMotion,
  introPlaying,
  children,
}: {
  reducedMotion: boolean;
  introPlaying: boolean;
  children: ReactNode;
}) {
  const elapsedRef = useRef(reducedMotion ? INTRO_TIMELINE.done : 0);
  const startRef = useRef<number | null>(null);

  useFrame((state) => {
    if (reducedMotion || !introPlaying) {
      elapsedRef.current = INTRO_TIMELINE.done;
      return;
    }
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    elapsedRef.current = state.clock.elapsedTime - startRef.current;
  });

  const value = useMemo<IntroClockContextValue>(
    () => ({ elapsedRef, reducedMotion }),
    [reducedMotion]
  );

  return (
    <IntroClockContext.Provider value={value}>
      {children}
    </IntroClockContext.Provider>
  );
}

export function useIntroClock(): IntroClockContextValue {
  const ctx = useContext(IntroClockContext);
  if (!ctx) {
    throw new Error("useIntroClock must be used within IntroClockProvider");
  }
  return ctx;
}
