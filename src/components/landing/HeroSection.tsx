"use client";

import { EasycompChatBotManager3DScene } from "./EasycompChatBotManager3DScene";
import { FadeIn } from "./landing-motion";
import { Button } from "@/components/ui/button";
import { LANDING_SECTIONS } from "@/lib/landing/constants";
import { trackLandingEvent } from "@/lib/landing/analytics";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-28 lg:min-h-[92svh] lg:pb-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 size-[28rem] rounded-full bg-[#7678ed]/15 blur-3xl" />
        <div className="absolute top-1/3 right-0 size-[24rem] rounded-full bg-[#38bdf8]/12 blur-3xl" />
        <div className="absolute bottom-0 left-0 size-[20rem] rounded-full bg-[#a78bfa]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <FadeIn className="max-w-xl">
          <p className="mb-4 text-sm font-semibold tracking-wide text-[var(--landing-accent)] uppercase">
            Atención inteligente para negocios que venden por WhatsApp
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--landing-ink)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Convierte cada conversación en una oportunidad de venta
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--landing-muted)]">
            easycomp-chat-bot-manager ordena tus chats, responde consultas con inteligencia
            artificial y conecta a tus clientes con tu equipo cuando necesitan
            atención humana.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              render={<a href={`#${LANDING_SECTIONS.demo}`} />}
              onClick={() => trackLandingEvent("hero_demo_clicked")}
              className="h-11 bg-[var(--landing-accent)] px-6 text-base text-white hover:bg-[var(--landing-accent)]/90"
            >
              Solicitar una demostración
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href={`#${LANDING_SECTIONS.comoFunciona}`} />}
              onClick={() => trackLandingEvent("hero_how_it_works_clicked")}
              className="h-11 border-[var(--landing-ink)]/15 bg-white/60 px-6 text-base text-[var(--landing-ink)] backdrop-blur-sm hover:bg-white"
            >
              Ver cómo funciona
            </Button>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-[var(--landing-muted)]">
            WhatsApp Business Platform · IA con información de tu negocio ·
            Atención humana cuando importa
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="w-full">
          <EasycompChatBotManager3DScene />
        </FadeIn>
      </div>
    </section>
  );
}
