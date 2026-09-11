import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FadeIn, SectionHeader } from "./landing-motion";
import { CURRENT_FEATURES, FUTURE_CHANNELS } from "@/lib/landing/constants";

export function OmnichannelSection() {
  return (
    <section
      id="funciones"
      className="scroll-mt-24 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Funciones"
          title="WhatsApp hoy, más canales en el camino"
          description="easycomp-chat-bot-manager comienza con WhatsApp Business Platform y está preparada para crecer hacia una atención omnicanal."
          align="center"
        />

        <FadeIn className="mt-12">
          <div className="rounded-2xl border border-[#7678ed]/20 bg-gradient-to-br from-[#7678ed]/5 to-white p-8">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#7678ed]/15">
                <MessageCircle className="size-6 text-[var(--landing-accent)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--landing-ink)]">
                  WhatsApp Business Platform
                </h3>
                <p className="text-sm text-[var(--landing-muted)]">
                  Canal principal disponible hoy
                </p>
              </div>
            </div>

            <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CURRENT_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-[var(--landing-ink)]/85"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--landing-accent)]" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>

        <FadeIn className="mt-8">
          <p className="mb-4 text-center text-sm font-medium text-[var(--landing-muted)]">
            Expansión futura del ecosistema
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {FUTURE_CHANNELS.map((channel) => (
              <div
                key={channel.name}
                className="flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-sm text-[var(--landing-ink)]/70 backdrop-blur-sm"
              >
                <span>{channel.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {channel.status}
                </Badge>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
