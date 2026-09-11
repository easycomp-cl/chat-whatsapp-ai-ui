import { X, Check } from "lucide-react";
import { FadeIn, SectionHeader } from "./landing-motion";

const WITHOUT = [
  "Mensajes dispersos entre celulares",
  "Respuestas repetitivas del equipo",
  "Clientes esperando sin seguimiento",
  "Poca trazabilidad de conversaciones",
  "Información dependiente de una persona",
  "Dificultad para asignar chats",
];

const WITH = [
  "Bandeja centralizada para todo el equipo",
  "Respuestas asistidas con contexto",
  "Derivación organizada a personas",
  "Historial y métricas disponibles",
  "Información empresarial accesible",
  "Asignaciones y estados claros",
];

export function ComparisonSection() {
  return (
    <section className="bg-white/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Comparación"
          title="La diferencia de atender con orden"
          align="center"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <FadeIn>
            <div className="h-full rounded-2xl border border-red-100 bg-red-50/40 p-8">
              <h3 className="text-lg font-semibold text-red-800/90">
                Sin easycomp-chat-bot-manager
              </h3>
              <ul className="mt-6 space-y-3">
                {WITHOUT.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-[var(--landing-ink)]/75"
                  >
                    <X className="mt-0.5 size-4 shrink-0 text-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="h-full rounded-2xl border border-[#7678ed]/25 bg-gradient-to-br from-[#7678ed]/8 to-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--landing-accent)]">
                Con easycomp-chat-bot-manager
              </h3>
              <ul className="mt-6 space-y-3">
                {WITH.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-[var(--landing-ink)]/85"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
