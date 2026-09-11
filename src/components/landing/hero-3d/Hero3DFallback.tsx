"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { HERO_3D_COLORS, LOGO_ASSET_STATUS } from "./hero-3d.config";

type Hero3DFallbackProps = {
  className?: string;
  reducedMotion?: boolean;
  reason?: "webgl" | "error" | "reduced-motion" | "low-device" | "loading";
};

export function Hero3DFallback({
  className,
  reducedMotion = false,
  reason = "webgl",
}: Hero3DFallbackProps) {
  const animate = !reducedMotion;

  return (
    <div
      className={cn(
        "relative mx-auto aspect-square h-full w-full max-w-lg [perspective:1400px]",
        className
      )}
      role="img"
      aria-label="Visualización del motor conversacional easycomp-chat-bot-manager"
      data-hero3d-fallback={reason}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${HERO_3D_COLORS.violet}40, transparent 65%)`,
        }}
      />
      <div
        className="absolute inset-10 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle at 60% 25%, ${HERO_3D_COLORS.cyan}33, transparent 60%)`,
        }}
      />

      <div className="absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6d5ef5]/25 sm:size-64" />
      <div className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#3ee6d0]/30 sm:size-80" />

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative [transform-style:preserve-3d]"
          animate={
            animate
              ? { rotateY: [0, 8, 0, -8, 0], rotateX: [0, -4, 0, 4, 0] }
              : undefined
          }
          transition={
            animate
              ? { duration: 14, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <div
            className="absolute inset-0 rounded-[2.25rem] bg-[#4438ca]/70 blur-[2px]"
            style={{ transform: "translateZ(-28px) scale(0.94)" }}
          />
          <div
            className="absolute inset-0 rounded-[2.25rem]"
            style={{
              transform: "translateZ(-12px) scale(0.98)",
              background: `linear-gradient(135deg, ${HERO_3D_COLORS.violet}cc, ${HERO_3D_COLORS.blue}b3)`,
            }}
          />
          <div
            className="relative flex size-44 items-center justify-center rounded-[2.25rem] border border-white/40 shadow-[0_30px_90px_rgba(68,56,202,0.5)] sm:size-52"
            style={{
              transform: "translateZ(4px)",
              background: `linear-gradient(135deg, ${HERO_3D_COLORS.violet}, #5b6bf0, ${HERO_3D_COLORS.blue})`,
            }}
          >
            <Image
              src={LOGO_ASSET_STATUS.markPng}
              alt=""
              width={200}
              height={200}
              unoptimized
              className="relative z-10 size-24 drop-shadow-[0_8px_20px_rgba(0,0,0,0.25)] sm:size-28"
              priority={false}
            />
          </div>
        </motion.div>
      </div>

      {/* Abstract flow cards — decorative only */}
      <motion.div
        className="absolute top-4 left-2 max-w-[9.5rem] rounded-2xl border border-white/60 bg-white/85 p-2.5 shadow-lg backdrop-blur-md sm:left-4"
        initial={animate ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="h-1.5 w-10 rounded-full bg-[#397bff]/70" />
        <div className="mt-2 h-1.5 w-16 rounded-full bg-black/10" />
      </motion.div>

      <motion.div
        className="absolute top-1/2 right-2 max-w-[8.5rem] -translate-y-1/2 rounded-2xl border border-white/60 bg-white/85 p-2.5 shadow-lg backdrop-blur-md sm:right-4"
        initial={animate ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
      >
        <div className="size-2 rounded-full bg-[#6d5ef5]" />
        <div className="mt-2 h-1.5 w-14 rounded-full bg-black/10" />
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 hidden w-40 -translate-x-1/2 rounded-2xl border border-white/60 bg-white/90 p-2 shadow-xl backdrop-blur-md sm:block"
        initial={animate ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <div className="mb-1.5 h-1 w-16 rounded-full bg-black/15" />
        <div className="space-y-1">
          <div className="h-5 rounded-md bg-[#00a884]/15" />
          <div className="h-5 rounded-md bg-[#6d5ef5]/10" />
        </div>
      </motion.div>
    </div>
  );
}
