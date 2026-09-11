"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { Hero3DFallback } from "./Hero3DFallback";
import {
  clampProgress,
  resolveBreakpoint,
  resolveQuality,
} from "./hero-3d.config";
import type { EasycompChatBotManagerHero3DProps, ResolvedHero3DQuality } from "./hero-3d.types";
import {
  useDevicePixelRatio,
  useInViewport,
  usePrefersReducedMotion,
  useViewportWidth,
  useWebGLSupport,
} from "./use-hero-3d-runtime";

const EasycompChatBotManagerHeroCanvas = dynamic(
  () => import("./EasycompChatBotManagerHeroCanvas").then((m) => m.EasycompChatBotManagerHeroCanvas),
  { ssr: false, loading: () => null }
);

/**
 * Public easycomp-chat-bot-manager hero 3D module.
 * Fills its parent container. Decorative for screen readers (`aria-hidden`).
 * pointer-events are disabled on the canvas so CTAs remain clickable.
 */
export function EasycompChatBotManagerHero3D({
  className,
  reducedMotion: reducedMotionProp,
  quality = "auto",
  progress,
  onReady,
  onError,
}: EasycompChatBotManagerHero3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion(reducedMotionProp);
  const viewportWidth = useViewportWidth();
  const dpr = useDevicePixelRatio();
  const inView = useInViewport(containerRef);
  const webgl = useWebGLSupport();
  const progressValue = clampProgress(progress);

  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const resolvedQuality: ResolvedHero3DQuality = useMemo(
    () =>
      resolveQuality(quality, {
        width: viewportWidth,
        dpr,
        reducedMotion,
      }),
    [quality, viewportWidth, dpr, reducedMotion]
  );

  const breakpoint = useMemo(
    () => resolveBreakpoint(viewportWidth),
    [viewportWidth]
  );

  const showFallback = !webgl || failed || reducedMotion;

  const handleReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);

  const handleError = useCallback(
    (error: Error) => {
      setFailed(true);
      onError?.(error);
    },
    [onError]
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-square w-full max-w-lg", className)}
      aria-hidden="true"
      data-hero3d-ready={ready ? "true" : "false"}
      data-hero3d-quality={resolvedQuality}
    >
      {showFallback ? (
        <Hero3DFallback
          reducedMotion={reducedMotion}
          reason={
            reducedMotion
              ? "reduced-motion"
              : failed
                ? "error"
                : !webgl
                  ? "webgl"
                  : "low-device"
          }
        />
      ) : (
        <>
          {!ready ? (
            <div className="absolute inset-0">
              <Hero3DFallback reducedMotion={reducedMotion} reason="loading" />
            </div>
          ) : null}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              ready ? "opacity-100" : "opacity-0"
            )}
          >
            <ErrorBoundary onError={handleError}>
              <EasycompChatBotManagerHeroCanvas
                quality={resolvedQuality}
                breakpoint={breakpoint}
                reducedMotion={reducedMotion}
                progress={progressValue}
                paused={!inView}
                onReady={handleReady}
                onError={handleError}
              />
            </ErrorBoundary>
          </div>
        </>
      )}
    </div>
  );
}

class ErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
