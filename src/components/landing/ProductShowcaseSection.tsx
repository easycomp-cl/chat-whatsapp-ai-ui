"use client";

import { Bot, MoreHorizontal, Search, Send, Sparkles, Tag } from "lucide-react";
import { motion } from "motion/react";
import { FadeIn, SectionHeader } from "./landing-motion";
import { useReducedMotion } from "@/lib/landing/use-reduced-motion";

const CONVERSATIONS = [
  {
    name: "María González",
    initials: "MG",
    preview: "Cotización 20 unidades con logo",
    time: "12:04",
    mode: "assigned" as const,
    active: true,
  },
  {
    name: "Pedro López",
    initials: "PL",
    preview: "¿Tienen despacho a Valparaíso?",
    time: "11:52",
    mode: "bot" as const,
    active: false,
  },
  {
    name: "Ana Ramírez",
    initials: "AR",
    preview: "Derivación: pago rechazado",
    time: "11:30",
    mode: "human" as const,
    active: false,
  },
];

const MODE_STYLES = {
  assigned: { label: "Asignada", className: "bg-[#00a884]/12 text-[#00a884]" },
  bot: { label: "Bot", className: "bg-[#6d5ef5]/12 text-[#6d5ef5]" },
  human: { label: "Humano", className: "bg-[#ff7a55]/12 text-[#c44d2a]" },
} as const;

export function ProductShowcaseSection() {
  const reduced = useReducedMotion();

  return (
    <section className="landing-ambient-violet py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="El producto"
          title="Así se ve tu bandeja easycomp-chat-bot-manager"
          description="Una vista real de cómo tu equipo administra conversaciones, etiquetas, asignaciones y sugerencias de la IA en un solo lugar."
          align="center"
        />

        <FadeIn delay={0.1} className="relative mt-14">
          {/* Etiqueta flotante de profundidad */}
          <motion.div
            className="absolute -top-5 right-4 z-10 hidden items-center gap-2 rounded-xl border border-white/70 bg-white px-3 py-2 text-xs font-semibold text-[var(--landing-ink)] shadow-lg sm:flex sm:right-10"
            initial={reduced ? false : { opacity: 0, y: -12 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <span className="size-2 rounded-full bg-[#00a884]" />
            3 conversaciones activas hoy
          </motion.div>

          {/* Marco tipo producto */}
          <div
            className="relative mx-auto max-w-4xl rounded-[1.75rem] border border-white/70 bg-white shadow-[0_50px_120px_-20px_rgba(68,56,202,0.35)]"
            style={{ transform: "perspective(1600px) rotateX(1.5deg)" }}
          >
            {/* Barra superior tipo navegador */}
            <div className="flex items-center gap-2 rounded-t-[1.75rem] border-b border-black/5 bg-[#f7f8ff] px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#ff7a55]/60" />
              <span className="size-2.5 rounded-full bg-[#ffcf5c]/70" />
              <span className="size-2.5 rounded-full bg-[#00a884]/60" />
              <span className="ml-3 rounded-full bg-white px-3 py-1 text-[11px] text-[var(--landing-muted)]">
                app.easycomp.cl/conversations
              </span>
            </div>

            <div className="grid grid-cols-[minmax(0,14rem)_1fr] sm:grid-cols-[minmax(0,15rem)_1fr]">
              {/* Lista de conversaciones */}
              <div className="border-r border-black/5">
                <div className="flex items-center gap-2 border-b border-black/5 px-3 py-3">
                  <Search className="size-3.5 text-[var(--landing-muted)]" />
                  <span className="text-xs text-[var(--landing-muted)]">Buscar…</span>
                </div>
                <ul>
                  {CONVERSATIONS.map((c) => (
                    <li
                      key={c.name}
                      className={
                        c.active
                          ? "flex items-center gap-2.5 border-l-[3px] border-l-[#00a884] bg-[#00a884]/8 px-3 py-3"
                          : "flex items-center gap-2.5 px-3 py-3"
                      }
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#6d5ef5]/12 text-[11px] font-semibold text-[#6d5ef5]">
                        {c.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs font-semibold text-[var(--landing-ink)]">
                            {c.name}
                          </span>
                          <span className="shrink-0 text-[10px] text-[var(--landing-muted)]">
                            {c.time}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-[var(--landing-muted)]">
                          {c.preview}
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${MODE_STYLES[c.mode].className}`}
                        >
                          {MODE_STYLES[c.mode].label}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Panel de conversación activa */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-[#6d5ef5]/12 text-[11px] font-semibold text-[#6d5ef5]">
                      MG
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--landing-ink)]">
                        María González
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#00a884]/12 px-1.5 py-0.5 text-[9px] font-semibold text-[#00a884]">
                          <Tag className="size-2.5" /> Cotización
                        </span>
                        <span className="text-[10px] text-[var(--landing-muted)]">
                          Asignada a Camila
                        </span>
                      </div>
                    </div>
                  </div>
                  <MoreHorizontal className="size-4 text-[var(--landing-muted)]" />
                </div>

                <div className="flex-1 space-y-2.5 px-4 py-4">
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[#6d5ef5] px-3.5 py-2 text-xs text-white">
                    Hola, necesito cotizar 20 unidades con mi logo.
                  </div>

                  <div className="max-w-[85%]">
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-[#397bff]">
                      <Sparkles className="size-3" />
                      Sugerencia de IA
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-[#f0f2f5] px-3.5 py-2 text-xs text-[var(--landing-ink)]">
                      ¡Claro! Para cotizar necesito el tamaño y el archivo de tu
                      logo.
                    </div>
                    <div className="mt-1.5 flex gap-1.5">
                      <span className="rounded-full bg-[#6d5ef5] px-2.5 py-1 text-[10px] font-semibold text-white">
                        Usar respuesta
                      </span>
                      <span className="rounded-full border border-black/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--landing-muted)]">
                        Editar
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-black/5 px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#6d5ef5]/10 px-2 py-1 text-[10px] font-semibold text-[#6d5ef5]">
                    <Bot className="size-3" /> IA activa
                  </span>
                  <div className="flex-1 rounded-full bg-[#f7f8ff] px-3 py-1.5 text-[11px] text-[var(--landing-muted)]">
                    Escribe un mensaje…
                  </div>
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#6d5ef5] text-white">
                    <Send className="size-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
