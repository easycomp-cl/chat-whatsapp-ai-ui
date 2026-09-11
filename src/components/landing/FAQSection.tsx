"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FadeIn, SectionHeader } from "./landing-motion";
import { LANDING_FAQ } from "@/lib/landing/constants";
import { cn } from "@/lib/utils";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="scroll-mt-24 bg-white/40 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Preguntas frecuentes"
          title="Resolvemos tus dudas"
          align="center"
        />

        <div className="mt-10 space-y-3">
          {LANDING_FAQ.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <FadeIn key={item.question} delay={i * 0.05}>
                <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur-sm">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <span className="text-sm font-semibold text-[var(--landing-ink)] sm:text-base">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-5 shrink-0 text-[var(--landing-muted)] transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-black/5 px-5 py-4">
                      <p className="text-sm leading-relaxed text-[var(--landing-muted)]">
                        {item.answer}
                      </p>
                    </div>
                  ) : null}
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
