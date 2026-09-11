"use client";

import { useState } from "react";
import { EasycompChatBotManagerHero3D, Hero3DFallback } from "@/components/landing/hero-3d";
import type { Hero3DQuality } from "@/components/landing/hero-3d";

/**
 * Isolated playground for the easycomp-chat-bot-manager hero 3D module.
 * Available only via /dev/hero-3d in development.
 */
export function Hero3DDevPlayground() {
  const [quality, setQuality] = useState<Hero3DQuality>("auto");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const [size, setSize] = useState<"sm" | "md" | "lg">("md");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [forceError, setForceError] = useState(false);
  const [status, setStatus] = useState("idle");

  const sizeClass =
    size === "sm" ? "max-w-xs" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div
      className={
        theme === "dark"
          ? "min-h-screen bg-[#090b1a] text-white"
          : "min-h-screen bg-[#f7f8ff] text-[#111326]"
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <p className="text-xs font-semibold tracking-wide text-[#6d5ef5] uppercase">
            Dev only · /dev/hero-3d
          </p>
          <h1 className="mt-2 text-2xl font-bold">easycomp-chat-bot-manager Hero 3D</h1>
          <p className="mt-2 max-w-2xl text-sm opacity-70">
            Playground aislado. No forma parte de la landing pública. Status:{" "}
            <span className="font-mono">{status}</span>
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="order-2 space-y-4 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm text-[#111326] shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white lg:order-1">
            <label className="block space-y-1">
              <span className="font-medium">Quality</span>
              <select
                className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 dark:border-white/15 dark:bg-[#10132b]"
                value={quality}
                onChange={(e) => setQuality(e.target.value as Hero3DQuality)}
              >
                <option value="auto">auto</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
              />
              reducedMotion
            </label>

            <label className="block space-y-1">
              <span className="font-medium">progress ({progress.toFixed(2)})</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-medium">Size</span>
              <select
                className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 dark:border-white/15 dark:bg-[#10132b]"
                value={size}
                onChange={(e) => setSize(e.target.value as "sm" | "md" | "lg")}
              >
                <option value="sm">sm</option>
                <option value="md">md</option>
                <option value="lg">lg</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="font-medium">Background</span>
              <select
                className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 dark:border-white/15 dark:bg-[#10132b]"
                value={theme}
                onChange={(e) => setTheme(e.target.value as "light" | "dark")}
              >
                <option value="light">light</option>
                <option value="dark">dark</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={forceError}
                onChange={(e) => {
                  setForceError(e.target.checked);
                  setStatus(e.target.checked ? "forced-error" : "idle");
                }}
              />
              simular error (fallback)
            </label>
          </aside>

          <div className="order-1 flex flex-col items-center justify-center rounded-3xl border border-dashed border-black/10 p-4 sm:p-6 dark:border-white/15 lg:order-2">
            <div className={`w-full ${sizeClass}`}>
              {forceError ? (
                <Hero3DFallback reducedMotion={reducedMotion} reason="error" />
              ) : (
                <EasycompChatBotManagerHero3D
                  key={`${quality}-${reducedMotion}`}
                  quality={quality}
                  reducedMotion={reducedMotion}
                  progress={progress}
                  onReady={() => setStatus("ready")}
                  onError={(err) => setStatus(`error: ${err.message}`)}
                />
              )}
            </div>
            <p className="mt-4 text-xs opacity-60">
              CTA de prueba (debe ser clickeable):{" "}
              <button
                type="button"
                className="rounded-md bg-[#6d5ef5] px-3 py-1.5 text-white"
                onClick={() => setStatus("cta-clicked")}
              >
                Solicitar demo
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
