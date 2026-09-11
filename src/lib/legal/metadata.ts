import type { Metadata } from "next";
import {
  LEGAL_CANONICAL_BASE,
  LEGAL_PRODUCT_NAME,
  LEGAL_VERCEL_BASE,
} from "./constants";

function resolveCanonicalBase(): string {
  if (
    LEGAL_CANONICAL_BASE.startsWith("[COMPLETAR") ||
    !LEGAL_CANONICAL_BASE.startsWith("http")
  ) {
    return LEGAL_VERCEL_BASE;
  }
  return LEGAL_CANONICAL_BASE.replace(/\/$/, "");
}

export function buildLegalMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const base = resolveCanonicalBase();
  const canonical = `${base}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: LEGAL_PRODUCT_NAME,
      locale: "es_CL",
      type: "website",
    },
  };
}
