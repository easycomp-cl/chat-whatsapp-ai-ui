"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type PointerState = { x: number; y: number };

type PointerContextValue = {
  /** Normalized pointer position in [-1, 1]; (0,0) when idle/touch/disabled. */
  pointerRef: RefObject<PointerState>;
  isTouchRef: RefObject<boolean>;
};

const PointerContext = createContext<PointerContextValue | null>(null);

/**
 * Single shared pointer listener for the whole scene (camera parallax +
 * logo "gaze"), so cursor tracking feels like one coherent depth effect
 * instead of duplicated/desynced listeners.
 *
 * The canvas has `pointer-events: none` (so CTAs behind it stay clickable),
 * which also means R3F's own event system never sees pointer moves — we
 * listen on `window` instead. Crucially, coordinates are normalized against
 * the canvas' own bounding rect (not the whole viewport): the hero card is
 * usually much smaller than the window, so mapping against `innerWidth` /
 * `innerHeight` made the effect barely react to normal mouse movement over
 * the card. Using the canvas rect makes the response track the cursor 1:1
 * across the card, which reads as fluid.
 */
export function PointerProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const pointerRef = useRef<PointerState>({ x: 0, y: 0 });
  const isTouchRef = useRef(false);
  const domElement = useThree((s) => s.gl.domElement);

  useEffect(() => {
    isTouchRef.current =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    if (!enabled || isTouchRef.current) return;

    const onMove = (e: PointerEvent) => {
      const rect = domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerRef.current.x = THREE.MathUtils.clamp(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -1,
        1
      );
      pointerRef.current.y = THREE.MathUtils.clamp(
        ((e.clientY - rect.top) / rect.height) * 2 - 1,
        -1,
        1
      );
    };
    const onLeave = () => {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, domElement]);

  const value = useMemo<PointerContextValue>(
    () => ({ pointerRef, isTouchRef }),
    []
  );

  return (
    <PointerContext.Provider value={value}>{children}</PointerContext.Provider>
  );
}

export function usePointer(): PointerContextValue {
  const ctx = useContext(PointerContext);
  if (!ctx) {
    throw new Error("usePointer must be used within PointerProvider");
  }
  return ctx;
}
