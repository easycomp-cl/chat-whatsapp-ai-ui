"use client";

import { Link2, Settings2, Inbox, Database } from "lucide-react";
import { FadeIn, SectionHeader } from "./landing-motion";

const STEPS = [
  {
    icon: Link2,
    step: "01",
    title: "Conecta tu WhatsApp",
    description:
      "Integra tu línea mediante WhatsApp Business Platform para centralizar las conversaciones en un solo lugar.",
  },
  {
    icon: Database,
    step: "02",
    title: "Carga la información de tu negocio",
    description:
      "Productos, servicios, precios, horarios, políticas y preguntas frecuentes que la IA puede consultar.",
  },
  {
    icon: Settings2,
    step: "03",
    title: "Configura qué responde y cuándo derivar",
    description:
      "Define reglas de atención, mensajes de respaldo y cuándo debe intervenir una persona de tu equipo.",
  },
  {
    icon: Inbox,
    step: "04",
    title: "Atiende desde una bandeja ordenada",
    description:
      "Tu equipo colabora en la misma bandeja con historial, asignaciones y contexto compartido.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-24 bg-white/40 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Cómo funciona"
          title="De mensajes dispersos a atención organizada"
          description="Cuatro pasos para profesionalizar la conversación comercial de tu negocio."
          align="center"
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <FadeIn key={step.title} delay={i * 0.08}>
              <div className="group relative h-full rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <step.icon className="size-6 text-[var(--landing-accent)]" />
                  <span className="text-xs font-bold text-[var(--landing-accent)]/40">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--landing-ink)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">
                  {step.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
