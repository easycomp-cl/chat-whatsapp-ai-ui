import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { LastUpdatedBadge } from "./last-updated-badge";

type LegalPageLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  relatedLinks: Array<{ href: string; label: string }>;
};

export function LegalPageLayout({
  title,
  subtitle,
  children,
  relatedLinks,
}: LegalPageLayoutProps) {
  return (
    <div className="legal-page min-h-screen bg-[var(--chat-surface)] text-foreground">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-[56rem] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <Logo variant="lockup" size="sm" priority />
          </Link>
          <nav aria-label="Enlaces legales" className="flex flex-wrap gap-3 text-sm">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/"
              className="text-[var(--chat-primary)] underline-offset-2 hover:underline"
            >
              Volver al sitio
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[56rem] px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 space-y-3 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--chat-dark)] sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-3xl text-base text-muted-foreground">{subtitle}</p>
          ) : null}
          <LastUpdatedBadge />
        </header>

        <article className="space-y-10">{children}</article>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-[56rem] flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} easycomp-chat-bot-manager · EasyComp</p>
          <nav aria-label="Pie de página legal" className="flex flex-wrap gap-4">
            <Link
              href="/politica-de-privacidad"
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              Política de privacidad
            </Link>
            <Link
              href="/eliminacion-de-datos"
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              Eliminación de datos
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
