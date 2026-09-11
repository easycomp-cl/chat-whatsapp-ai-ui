import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LANDING_NAV_LINKS } from "@/lib/landing/constants";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/60 bg-white/50 py-12 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo variant="lockup" size="sm" />
            <p className="mt-3 max-w-xs text-sm text-[var(--landing-muted)]">
              El sistema operativo de conversaciones y atención comercial para
              pymes.
            </p>
          </div>

          <nav aria-label="Enlaces del sitio" className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-[var(--landing-ink)]">Navegación</p>
              <ul className="mt-3 space-y-2">
                {LANDING_NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-[var(--landing-muted)] hover:text-[var(--landing-ink)]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--landing-ink)]">Legal</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/politica-de-privacidad"
                    className="text-sm text-[var(--landing-muted)] hover:text-[var(--landing-ink)]"
                  >
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link
                    href="/eliminacion-de-datos"
                    className="text-sm text-[var(--landing-muted)] hover:text-[var(--landing-ink)]"
                  >
                    Eliminación de datos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-[var(--landing-muted)] hover:text-[var(--landing-ink)]"
                  >
                    Iniciar sesión
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <p className="mt-10 border-t border-black/5 pt-6 text-center text-sm text-[var(--landing-muted)]">
          © {new Date().getFullYear()} easycomp-chat-bot-manager · EasyComp
        </p>
      </div>
    </footer>
  );
}
