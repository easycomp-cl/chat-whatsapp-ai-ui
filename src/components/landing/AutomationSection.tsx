import { Workflow, FileText, BarChart3 } from "lucide-react";
import { FadeIn, SectionHeader } from "./landing-motion";

const ITEMS = [
  {
    icon: Workflow,
    title: "Flujos configurables",
    description:
      "Automatiza cotizaciones, reservas y procesos con pasos definidos por tu negocio.",
  },
  {
    icon: FileText,
    title: "Plantillas de WhatsApp",
    description:
      "Utiliza plantillas aprobadas por Meta para recontactar clientes fuera de la ventana de 24 horas.",
  },
  {
    icon: BarChart3,
    title: "Métricas de atención",
    description:
      "Visualiza preguntas frecuentes y el estado general de tus conversaciones.",
  },
] as const;

export function AutomationSection() {
  return (
    <section className="landing-ambient-violet py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
          <SectionHeader
            eyebrow="Automatización"
            title="Procesos que avanzan mientras atiendes"
            description="Desde una cotización hasta una reserva, easycomp-chat-bot-manager guía al cliente y registra cada paso."
          />

          <div className="divide-y divide-black/5 border-t border-black/5 lg:border-t-0">
            {ITEMS.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="flex items-start gap-4 py-5 first:pt-0 lg:first:pt-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-accent)]/10">
                    <item.icon className="size-5 text-[var(--landing-accent)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--landing-ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--landing-muted)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
