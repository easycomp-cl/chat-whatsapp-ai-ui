"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { EasycompChatBotManagerScene } from "./EasycompChatBotManagerScene";
import { QUALITY_PRESETS } from "./hero-3d.config";
import type {
  Hero3DBreakpoint,
  ResolvedHero3DQuality,
} from "./hero-3d.types";

export type EasycompChatBotManagerHeroCanvasProps = {
  quality: ResolvedHero3DQuality;
  breakpoint: Hero3DBreakpoint;
  reducedMotion: boolean;
  progress: number;
  paused?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
};

export function EasycompChatBotManagerHeroCanvas({
  quality,
  breakpoint,
  reducedMotion,
  progress,
  paused = false,
  onReady,
  onError,
}: EasycompChatBotManagerHeroCanvasProps) {
  const settings = QUALITY_PRESETS[quality];

  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason instanceof Error) onError?.(reason);
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, [onError]);

  return (
    <Canvas
      className="h-full w-full touch-none"
      style={{ pointerEvents: "none" }}
      dpr={settings.dpr}
      gl={{
        antialias: settings.antialias,
        alpha: true,
        powerPreference: quality === "high" ? "high-performance" : "default",
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 0.08, 4.2], fov: 42, near: 0.1, far: 40 }}
      frameloop={paused ? "never" : "always"}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <EasycompChatBotManagerScene
          quality={quality}
          breakpoint={breakpoint}
          reducedMotion={reducedMotion}
          progress={progress}
          introPlaying={!paused}
          onReady={onReady}
        />
      </Suspense>
    </Canvas>
  );
}
