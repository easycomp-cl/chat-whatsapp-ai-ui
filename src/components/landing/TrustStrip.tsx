import { Shield, Users, Zap, MessageSquare } from "lucide-react";

const ITEMS = [
  {
    icon: MessageSquare,
    text: "Integración oficial mediante WhatsApp Business Platform",
  },
  {
    icon: Zap,
    text: "Control de IA por empresa y por conversación",
  },
  {
    icon: Users,
    text: "Bandeja compartida para equipos",
  },
  {
    icon: Shield,
    text: "Diseñado para atención comercial y soporte",
  },
] as const;

export function TrustStrip() {
  return (
    <section className="border-y border-white/60 bg-white/50 py-6 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {ITEMS.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-start gap-3 text-sm leading-snug text-[var(--landing-ink)]/80"
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-[var(--landing-accent)]" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
