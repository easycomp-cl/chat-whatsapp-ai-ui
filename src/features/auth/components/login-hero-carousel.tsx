"use client";

import { useEffect, useState } from "react";
import {
  LoginHeroArtChat,
  LoginHeroArtInbox,
  LoginHeroArtKnowledge,
} from "./login-hero-art";

const SLIDES = [
  {
    title: "Atiende WhatsApp con un asistente que conoce tu negocio",
    description: "Responde consultas, deriva a tu equipo y vende desde un solo lugar.",
    Art: LoginHeroArtChat,
  },
  {
    title: "Una bandeja para bot y humanos",
    description:
      "Estados, asignaciones y el mismo chat: el asistente responde y tu equipo entra cuando hace falta.",
    Art: LoginHeroArtInbox,
  },
  {
    title: "Conocimiento, plantillas y flujos",
    description:
      "Catálogo, FAQs y automatizaciones para que el bot hable con datos reales de tu negocio.",
    Art: LoginHeroArtKnowledge,
  },
] as const;

const ROTATE_MS = 8000;

export function LoginHeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, ROTATE_MS);

    return () => window.clearInterval(id);
  }, [paused, index]);

  return (
    <div
      className="relative z-10 flex min-h-[460px] flex-1 flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[400px] flex-1">
        {SLIDES.map((item, slideIndex) => {
          const SlideArt = item.Art;
          const active = slideIndex === index;
          return (
            <div
              key={item.title}
              className={
                active
                  ? "absolute inset-0 z-10 flex flex-col justify-between opacity-100 transition-opacity duration-1000 ease-in-out"
                  : "pointer-events-none absolute inset-0 z-0 flex flex-col justify-between opacity-0 transition-opacity duration-1000 ease-in-out"
              }
              aria-hidden={!active}
              inert={!active}
            >
              <div className="flex flex-1 items-center">
                <SlideArt />
              </div>
              <div className="mx-auto max-w-md text-center">
                <h2 className="text-xl font-semibold tracking-tight text-[#202022] sm:text-2xl">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#5c5f6b]">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="relative mt-6 flex justify-center gap-1.5"
        role="tablist"
        aria-label="Puntos clave"
      >
        {SLIDES.map((item, slideIndex) => {
          const active = slideIndex === index;
          return (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={item.title}
              onClick={() => setIndex(slideIndex)}
              className={
                active
                  ? "h-1.5 w-6 rounded-full bg-[#22d3a3] transition-all duration-700"
                  : "size-1.5 rounded-full bg-[#0d9488]/35 transition-all duration-700 hover:bg-[#c4121a]/50"
              }
            />
          );
        })}
      </div>
    </div>
  );
}
