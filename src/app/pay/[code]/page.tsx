import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";
import { getPublicPaymentLink } from "@/lib/bot-api/public-pay";

export const dynamic = "force-dynamic";

type PayPageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Pago ${decodeURIComponent(code)} | ${PRODUCT_DISPLAY_NAME}`,
    description: "Enlace de pago enviado por WhatsApp.",
    robots: { index: false, follow: false },
  };
}

export default async function PayPage({ params }: PayPageProps) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode);
  const payment = await getPublicPaymentLink(code);
  const orderRef = payment.order_ref || code;
  const businessName = payment.business_name;
  const destinationUrl = payment.destination_url;

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
          <p className="text-sm font-medium text-[var(--chat-primary)]">Enlace de pago</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--chat-dark)]">
            Pedido {orderRef}
          </h1>
          {businessName ? (
            <p className="mt-2 text-muted-foreground">{businessName}</p>
          ) : (
            <p className="mt-2 text-muted-foreground">
              Este enlace corresponde a un pedido enviado por WhatsApp.
            </p>
          )}

          {destinationUrl ? (
            <a
              href={destinationUrl}
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[var(--chat-primary)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Ir a pagar
            </a>
          ) : (
            <p className="mt-6 rounded-lg border bg-[var(--chat-surface)] px-4 py-3 text-sm text-muted-foreground">
              Completa el pago con el negocio y confirma por el mismo chat de WhatsApp.
              Si ya pagaste, responde el mensaje para que registren el comprobante.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
