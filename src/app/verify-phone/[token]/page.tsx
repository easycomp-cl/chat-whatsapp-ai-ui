import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";
import { getPublicPhoneVerification } from "@/lib/bot-api/public-verify";
import { ConfirmPhoneButton } from "./confirm-phone-button";

export const dynamic = "force-dynamic";

type VerifyPhonePageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Confirmar número | ${PRODUCT_DISPLAY_NAME}`,
    description: "Confirma el WhatsApp para recibir avisos del equipo.",
    robots: { index: false, follow: false },
  };
}

export default async function VerifyPhonePage({ params }: VerifyPhonePageProps) {
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken);
  const verification = await getPublicPhoneVerification(token);

  const title =
    verification.status === "used"
      ? "Este número ya está confirmado"
      : verification.status === "expired"
        ? "Este enlace venció"
        : verification.found
          ? "Confirmar este WhatsApp"
          : "Enlace no válido";

  return (
    <div className="min-h-screen bg-[var(--chat-surface)] text-foreground">
      <header className="border-b bg-background/95">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
          <Link href="/" className="inline-flex items-center">
            <Logo variant="lockup" size="sm" priority />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <div className="rounded-2xl border bg-background p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-[var(--chat-primary)]">Equipo</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--chat-dark)]">
            {title}
          </h1>
          {verification.business_name ? (
            <p className="mt-2 text-muted-foreground">{verification.business_name}</p>
          ) : null}
          {verification.phone_masked ? (
            <p className="mt-1 text-sm text-muted-foreground">{verification.phone_masked}</p>
          ) : null}

          {verification.status === "pending" ? (
            <>
              <p className="mt-4 text-sm text-muted-foreground">
                Vas a recibir avisos cuando un cliente pida atención humana. Si no fuiste
                agregado a este equipo, cierra esta página.
              </p>
              <ConfirmPhoneButton token={token} />
            </>
          ) : verification.status === "used" ? (
            <p className="mt-6 text-sm text-muted-foreground">Ya puedes cerrar esta página.</p>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Pide otra confirmación desde el panel del negocio.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
