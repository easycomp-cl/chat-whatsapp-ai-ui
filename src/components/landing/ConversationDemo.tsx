"use client";

import { useEffect, useState } from "react";
import { FadeIn, SectionHeader } from "./landing-motion";
import { useReducedMotion } from "@/lib/landing/use-reduced-motion";
import { cn } from "@/lib/utils";

type Message = {
  role: "client" | "bot" | "system";
  text: string;
};

const CONVERSATION: Message[] = [
  {
    role: "client",
    text: "Hola, necesito cotizar 20 unidades con mi logo.",
  },
  {
    role: "bot",
    text: "¡Claro! Para preparar la cotización necesito conocer el tamaño y que nos envíes el archivo de tu logo.",
  },
  {
    role: "client",
    text: "Quiero el tamaño mediano. Te envío el logo.",
  },
  {
    role: "system",
    text: "Logo recibido · Pendiente de revisión.",
  },
  {
    role: "bot",
    text: "Perfecto. Un integrante del equipo revisará el archivo antes de confirmar la cotización.",
  },
  {
    role: "system",
    text: "Conversación asignada a Camila.",
  },
];

export function ConversationDemo() {
  const reduced = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(reduced ? CONVERSATION.length : 1);

  useEffect(() => {
    if (reduced) return;
    if (visibleCount >= CONVERSATION.length) return;
    const timer = window.setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [visibleCount, reduced]);

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Ejemplo real"
          title="Así se ve una conversación con easycomp-chat-bot-manager"
          description="La IA recopila información, el flujo puede incluir validaciones y una persona interviene cuando hace falta — sin perder el contexto."
          align="center"
        />

        <FadeIn className="mx-auto mt-12 max-w-xl">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-xl backdrop-blur-md sm:p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-black/5 pb-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#7678ed]/15 text-sm font-semibold text-[var(--landing-accent)]">
                MG
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--landing-ink)]">
                  María González
                </p>
                <p className="text-xs text-[var(--landing-muted)]">Cliente · WhatsApp</p>
              </div>
            </div>

            <div className="space-y-3" aria-live="polite">
              {CONVERSATION.slice(0, visibleCount).map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "client" &&
                      "ml-auto bg-[#7678ed] text-white rounded-br-md",
                    msg.role === "bot" &&
                      "mr-auto bg-[#f0f2f5] text-[var(--landing-ink)] rounded-bl-md",
                    msg.role === "system" &&
                      "mx-auto max-w-full bg-transparent text-center text-xs text-[var(--landing-muted)]"
                  )}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
