"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/landing/use-reduced-motion";
import { ConnectorDot } from "./landing-motion";
import { cn } from "@/lib/utils";

const FLOW_CARDS = [
  {
    key: "incoming",
    label: "Mensaje entrante",
    text: "Hola, necesito cotizar 20 unidades",
    position: "top-0 left-0 sm:left-2",
    delay: 0.2,
  },
  {
    key: "response",
    label: "Respuesta generada",
    text: "Necesito el tamaño y el archivo de tu logo",
    position: "bottom-[6%] left-0 sm:bottom-[28%] sm:left-4",
    delay: 0.9,
  },
  {
    key: "handoff",
    label: "Derivación",
    text: "Asignado a Camila",
    position: "bottom-[2%] right-0 sm:bottom-[24%] sm:right-4",
    delay: 1.2,
  },
] as const;

export function HeroFallback() {
  const reduced = useReducedMotion();

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-lg [perspective:1400px]"
      aria-hidden="true"
    >
      {/* Halos ambientales */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(109,94,245,0.28),transparent_65%)]" />
      <div className="absolute inset-10 rounded-full bg-[radial-gradient(circle_at_60%_25%,rgba(62,230,208,0.2),transparent_60%)] blur-2xl" />

      {/* Anillos orbitales */}
      <div className="absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6d5ef5]/20 sm:size-64" />
      <div className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#3ee6d0]/25 sm:size-80" />

      {/* Núcleo 3D con logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative [transform-style:preserve-3d]"
          animate={
            reduced
              ? undefined
              : { rotateY: [0, 10, 0, -10, 0], rotateX: [0, -5, 0, 5, 0] }
          }
          transition={
            reduced
              ? undefined
              : { duration: 14, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {/* Panel trasero — sugiere profundidad */}
          <div
            className="absolute inset-0 rounded-[2.25rem] bg-[#4438ca]/70 blur-[2px]"
            style={{ transform: "translateZ(-28px) scale(0.94)" }}
          />
          {/* Panel medio */}
          <div
            className="absolute inset-0 rounded-[2.25rem] bg-gradient-to-br from-[#6d5ef5]/80 to-[#397bff]/70"
            style={{ transform: "translateZ(-12px) scale(0.98)" }}
          />

          {/* Panel frontal con el logo */}
          <div
            className="relative flex size-44 items-center justify-center rounded-[2.25rem] border border-white/40 bg-gradient-to-br from-[#6d5ef5] via-[#5b6bf0] to-[#397bff] shadow-[0_30px_90px_rgba(68,56,202,0.5)] sm:size-52"
            style={{ transform: "translateZ(4px)" }}
          >
            <div className="absolute inset-0 rounded-[2.25rem] bg-white/8" />
            <div className="absolute inset-2 rounded-[1.9rem] border border-white/15" />
            <Image
              src="/easycomp-chat-bot-manager-mark.png"
              alt=""
              width={200}
              height={200}
              unoptimized
              className="relative z-10 size-24 drop-shadow-[0_8px_20px_rgba(0,0,0,0.25)] sm:size-28"
              priority
            />
            {/* Rim light cian */}
            <div className="absolute -inset-px rounded-[2.25rem] bg-gradient-to-tl from-[#3ee6d0]/0 via-transparent to-[#3ee6d0]/30" />
          </div>

          <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[#6d5ef5]/25 blur-3xl" />
        </motion.div>
      </div>

      {/* Nodo de análisis: intención + conocimiento (dos filas en una tarjeta) */}
      <motion.div
        className="absolute top-[38%] -right-1 max-w-[10.5rem] -translate-y-1/2 rounded-2xl border border-white/60 bg-white/85 p-3 shadow-lg backdrop-blur-md sm:top-1/2 sm:right-0 sm:max-w-[13rem]"
        initial={reduced ? false : { opacity: 0, y: 12, scale: 0.95 }}
        animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.55, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2">
          <ConnectorDot />
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-[#6d5ef5] uppercase">
              Intención
            </p>
            <p className="text-xs leading-snug text-[var(--landing-ink)]/85">
              Cotización
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 border-t border-black/5 pt-2">
          <ConnectorDot />
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-[#397bff] uppercase">
              Conocimiento
            </p>
            <p className="text-xs leading-snug text-[var(--landing-ink)]/85">
              Consultando información del negocio
            </p>
          </div>
        </div>
      </motion.div>

      {FLOW_CARDS.map((card) => (
        <motion.div
          key={card.key}
          className={cn(
            "absolute max-w-[11rem] rounded-2xl border border-white/60 bg-white/85 p-3 shadow-lg backdrop-blur-md sm:max-w-[12.5rem]",
            card.position
          )}
          initial={reduced ? false : { opacity: 0, y: 16, scale: 0.95 }}
          animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: card.delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[10px] font-semibold tracking-wide text-[#6d5ef5] uppercase">
            {card.label}
          </p>
          <p className="mt-1 text-xs leading-snug text-[var(--landing-ink)]/85">
            {card.text}
          </p>
        </motion.div>
      ))}

      {/* Miniatura de la bandeja organizada — solo desde sm+ para no saturar el móvil */}
      <motion.div
        className="absolute -bottom-6 left-1/2 hidden w-[15rem] -translate-x-1/2 rounded-2xl border border-white/60 bg-white/90 p-2.5 shadow-xl backdrop-blur-md sm:block"
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#00a884]" />
          <p className="text-[9px] font-semibold tracking-wide text-[var(--landing-ink)]/60 uppercase">
            Bandeja easycomp-chat-bot-manager
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between rounded-lg bg-[#00a884]/10 px-2 py-1">
            <span className="text-[10px] font-medium text-[var(--landing-ink)]">María G.</span>
            <span className="text-[9px] font-semibold text-[#00a884]">Asignada</span>
          </div>
          <div className="flex items-center justify-between rounded-lg px-2 py-1">
            <span className="text-[10px] text-[var(--landing-ink)]/70">Pedro L.</span>
            <span className="text-[9px] font-semibold text-[#6d5ef5]">Bot</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
