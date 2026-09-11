import type { Metadata } from "next";
import {
  LEGAL_BRAND_NAME,
  LEGAL_PRODUCT_NAME,
  LEGAL_VERCEL_BASE,
} from "@/lib/legal/constants";

function resolveBaseUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl?.startsWith("http")) return appUrl;
  return LEGAL_VERCEL_BASE.replace(/\/$/, "");
}

export function buildLandingMetadata(): Metadata {
  const base = resolveBaseUrl();
  const title = `${LEGAL_PRODUCT_NAME} | Atención inteligente para WhatsApp`;
  const description =
    "Organiza las conversaciones de tu negocio, responde consultas con inteligencia artificial y conecta a tus clientes con tu equipo desde una bandeja compartida.";

  return {
    title,
    description,
    alternates: { canonical: base },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: base,
      siteName: LEGAL_PRODUCT_NAME,
      locale: "es_CL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function buildLandingJsonLd() {
  const base = resolveBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: LEGAL_PRODUCT_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Plataforma de atención al cliente y automatización de conversaciones para pymes, con integración WhatsApp Business Platform.",
    url: base,
    provider: {
      "@type": "Organization",
      name: LEGAL_BRAND_NAME,
      url: base,
    },
  };
}
