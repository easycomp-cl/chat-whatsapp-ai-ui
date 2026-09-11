"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PRODUCT_SHORT_NAME } from "@/lib/brand/constants";
import { Button } from "@/components/ui/button";
import { LANDING_NAV_LINKS, LANDING_SECTIONS } from "@/lib/landing/constants";
import { trackLandingEvent } from "@/lib/landing/analytics";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/40 bg-white/75 shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="easyCOMP Chat Bot Manager inicio"
        >
          <Logo variant="mark" size="sm" priority />
          <span className="text-base font-semibold tracking-tight text-[var(--landing-ink)]">
            {PRODUCT_SHORT_NAME}
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 lg:flex"
        >
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--landing-ink)]/75 transition-colors hover:bg-white/60 hover:text-[var(--landing-ink)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            variant="ghost"
            render={<Link href="/login" />}
            onClick={() => trackLandingEvent("login_clicked")}
            className="text-[var(--landing-ink)]"
          >
            Iniciar sesión
          </Button>
          <Button
            render={<a href={`#${LANDING_SECTIONS.demo}`} />}
            onClick={() => trackLandingEvent("navbar_demo_clicked")}
            className="bg-[var(--landing-accent)] text-white hover:bg-[var(--landing-accent)]/90"
          >
            Solicitar demostración
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg border border-white/50 bg-white/60 text-[var(--landing-ink)] lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-menu"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div
          id="landing-mobile-menu"
          className="border-t border-white/40 bg-white/90 px-4 py-4 backdrop-blur-xl lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Menú móvil">
            {LANDING_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-[var(--landing-ink)]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="rounded-lg px-3 py-3 text-base font-medium text-[var(--landing-ink)]"
              onClick={() => {
                trackLandingEvent("login_clicked");
                setMobileOpen(false);
              }}
            >
              Iniciar sesión
            </Link>
            <a
              href={`#${LANDING_SECTIONS.demo}`}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-[var(--landing-accent)] px-4 py-3 text-base font-medium text-white"
              onClick={() => {
                trackLandingEvent("navbar_demo_clicked");
                setMobileOpen(false);
              }}
            >
              Solicitar demostración
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
