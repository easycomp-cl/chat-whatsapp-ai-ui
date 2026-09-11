import Link from "next/link";
import { Lock, ShieldCheck, Eye, KeyRound } from "lucide-react";
import { FadeIn, SectionHeader } from "./landing-motion";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Conexión mediante Meta",
    text: "Integración con WhatsApp Business Platform siguiendo los lineamientos oficiales.",
  },
  {
    icon: Lock,
    title: "Aislamiento por empresa",
    text: "Cada negocio opera con su información separada y accesos controlados.",
  },
  {
    icon: KeyRound,
    title: "Roles y permisos",
    text: "Define quién puede ver, responder y configurar la atención en tu equipo.",
  },
  {
    icon: Eye,
    title: "Trazabilidad",
    text: "Historial de mensajes, asignaciones y acciones para dar seguimiento.",
  },
] as const;

export function SecuritySection() {
  return (
    <section
      id="seguridad"
      className="scroll-mt-24 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Seguridad y control"
          title="Tu negocio mantiene el control"
          description="easycomp-chat-bot-manager está diseñado para que decidas cuándo la IA responde, cuándo interviene una persona y quién accede a cada conversación."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {ITEMS.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.08}>
              <div className="flex gap-4 rounded-2xl border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
                <item.icon className="size-6 shrink-0 text-[var(--landing-accent)]" />
                <div>
                  <h3 className="text-base font-semibold text-[var(--landing-ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--landing-muted)]">
                    {item.text}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-8 text-center text-sm text-[var(--landing-muted)]">
          <Link
            href="/politica-de-privacidad"
            className="underline-offset-2 hover:text-[var(--landing-ink)] hover:underline"
          >
            Política de privacidad
          </Link>
          {" · "}
          <Link
            href="/eliminacion-de-datos"
            className="underline-offset-2 hover:text-[var(--landing-ink)] hover:underline"
          >
            Eliminación de datos
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
