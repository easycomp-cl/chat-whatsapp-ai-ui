"use client";

import {
  Inbox,
  MessageSquare,
  ScanSearch,
  BookOpen,
  Sparkles,
  UserRound,
  Tags,
  History,
  ToggleLeft,
} from "lucide-react";
import { motion } from "motion/react";
import { FadeIn, SectionHeader, ConnectorDot } from "./landing-motion";
import { useReducedMotion } from "@/lib/landing/use-reduced-motion";

const TIMELINE = [
  {
    icon: MessageSquare,
    title: "Mensaje entrante",
    text: "Un cliente escribe por WhatsApp.",
  },
  {
    icon: ScanSearch,
    title: "Detecta intención",
    text: "Identifica de qué se trata: cotización, soporte, pago.",
  },
  {
    icon: BookOpen,
    title: "Consulta tu negocio",
    text: "Revisa productos, precios, horarios y políticas reales.",
  },
  {
    icon: Sparkles,
    title: "Genera una respuesta",
    text: "Responde o sugiere una respuesta lista para enviar.",
  },
  {
    icon: UserRound,
    title: "Interviene tu equipo",
    text: "Si el caso lo requiere, una persona toma el control con contexto.",
  },
] as const;

const CONTROLS = [
  {
    icon: Inbox,
    title: "Bandeja centralizada",
    text: "Todas las conversaciones, visibles para todo el equipo.",
  },
  {
    icon: Tags,
    title: "Estados y etiquetas",
    text: "Organiza por prioridad, tipo de consulta o etapa comercial.",
  },
  {
    icon: History,
    title: "Historial completo",
    text: "Mensajes, notas y acciones quedan siempre registrados.",
  },
  {
    icon: ToggleLeft,
    title: "Control del bot",
    text: "Pausa la IA global o por conversación, sin perder contexto.",
  },
] as const;

export function AIWorkflowSection() {
  const reduced = useReducedMotion();

  return (
    <section className="landing-ambient-dark py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Cómo piensa easycomp-chat-bot-manager"
          title="La IA trabaja detrás. Tu equipo mantiene el control."
          description="Cada mensaje recorre el mismo camino: se entiende, se responde con información real de tu negocio y, cuando hace falta, pasa a una persona sin perder el hilo."
          align="center"
          tone="dark"
        />

        {/* Timeline del flujo IA → humano */}
        <div className="relative mt-16">
          <div
            className="absolute top-6 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block"
            aria-hidden="true"
          />
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-6">
            {TIMELINE.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative flex flex-col items-start gap-3 lg:items-center lg:text-center"
                initial={reduced ? false : { opacity: 0, y: 18 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <div className="flex items-center gap-3 lg:flex-col lg:gap-2">
                  <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
                    <step.icon className="size-5 text-[var(--landing-cyan)]" />
                    <ConnectorDot className="absolute -top-1 -right-1" />
                  </div>
                  <span className="hidden text-xs font-semibold text-white/30 lg:block">
                    Paso {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--landing-dark-ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--landing-dark-muted)]">
                    {step.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Controles que se mantienen del lado del negocio */}
        <div className="mt-16 grid gap-3 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {CONTROLS.map((c, i) => (
            <FadeIn key={c.title} delay={i * 0.06}>
              <div className="flex h-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <c.icon className="size-4 shrink-0 text-[var(--landing-cyan)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--landing-dark-ink)]">
                    {c.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--landing-dark-muted)]">
                    {c.text}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
