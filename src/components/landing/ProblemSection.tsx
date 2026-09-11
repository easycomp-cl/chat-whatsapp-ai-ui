"use client";

import { motion } from "motion/react";
import { AlertCircle, Clock, Repeat } from "lucide-react";
import { FadeIn, SectionHeader } from "./landing-motion";
import { useReducedMotion } from "@/lib/landing/use-reduced-motion";

const PROBLEMS = [
  {
    icon: AlertCircle,
    title: "Mensajes que se pierden",
    description:
      "Consultas repartidas entre celulares, notificaciones y chats sin seguimiento claro.",
  },
  {
    icon: Clock,
    title: "Clientes que esperan",
    description:
      "Respuestas tardías cuando tu equipo está ocupado o fuera de horario.",
  },
  {
    icon: Repeat,
    title: "Tu equipo responde lo mismo una y otra vez",
    description:
      "Horarios, precios y disponibilidad se repiten en cada conversación.",
  },
] as const;

const CHAOTIC = [
  "¿Tienen stock?",
  "Precio del envío",
  "Hola, siguen abiertos?",
  "Me pueden cotizar",
  "Necesito hablar con alguien",
  "¿Aceptan transferencia?",
];

const ORGANIZED = [
  { name: "María G.", preview: "Cotización 20 unidades", status: "Pendiente" },
  { name: "Pedro L.", preview: "Consulta horario", status: "Bot activo" },
  { name: "Ana R.", preview: "Seguimiento despacho", status: "Asignada" },
];

export function ProblemSection() {
  const reduced = useReducedMotion();

  return (
    <section
      id="producto"
      className="scroll-mt-24 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="El problema"
          title="Tu atención comercial merece más orden"
          description="Cuando las conversaciones crecen, responder tarde o sin contexto puede costarte ventas y confianza."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PROBLEMS.map((problem, i) => (
            <FadeIn key={problem.title} delay={i * 0.1}>
              <div className="h-full rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
                <problem.icon className="size-6 text-[var(--landing-accent)]" />
                <h3 className="mt-4 text-lg font-semibold text-[var(--landing-ink)]">
                  {problem.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">
                  {problem.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
              <p className="text-sm font-semibold text-red-700/80">Bandeja caótica</p>
              <div className="mt-4 space-y-2">
                {CHAOTIC.map((msg, i) => (
                  <motion.div
                    key={msg}
                    className="rounded-xl bg-white/80 px-3 py-2 text-sm text-[var(--landing-ink)]/70 shadow-sm"
                    initial={reduced ? false : { x: (i % 2 === 0 ? -1 : 1) * 12, opacity: 0.6 }}
                    whileInView={reduced ? undefined : { x: (i % 3) * 6, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {msg}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#7678ed]/20 bg-gradient-to-br from-white to-[#7678ed]/5 p-6">
              <p className="text-sm font-semibold text-[var(--landing-accent)]">
                Bandeja easycomp-chat-bot-manager
              </p>
              <div className="mt-4 space-y-2">
                {ORGANIZED.map((item, i) => (
                  <motion.div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm"
                    initial={reduced ? false : { opacity: 0, x: 20 }}
                    whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--landing-ink)]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--landing-muted)]">
                        {item.preview}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#7678ed]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--landing-accent)]">
                      {item.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
