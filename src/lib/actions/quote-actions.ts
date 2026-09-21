"use server";

import { botApi, BotApiError, BOT_API_UNAVAILABLE_MESSAGE, getBotApiErrorMessage } from "@/lib/bot-api/client";
import { requireAppAccess } from "@/lib/auth/session";
import { normalizeCatalogProducts } from "@/lib/catalog/normalize-product";
import { normalizeQuotePreview } from "@/lib/quotes/normalize-preview";
import type { CatalogProduct } from "@/lib/bot-api/types";
import type { QuotePreview, QuotePreviewRequest } from "@/types/quote";
import { QUOTE_PDF_UNAVAILABLE_MESSAGE } from "@/types/quote";

function isQuoteEndpointUnavailable(error: unknown): boolean {
  return error instanceof BotApiError && (error.status === 404 || error.status === 405 || error.status === 501);
}

export async function listCatalogProductsAction(): Promise<
  | { ok: true; products: CatalogProduct[] }
  | { ok: false; error: string }
> {
  const profile = await requireAppAccess();
  const businessId = profile.business_id;
  if (!businessId) {
    return { ok: false, error: "No hay un negocio asociado a tu usuario." };
  }

  try {
    const products = await botApi.listCatalogProducts(businessId);
    return { ok: true, products: normalizeCatalogProducts(products) };
  } catch (error) {
    return {
      ok: false,
      error: getBotApiErrorMessage(error) || "No se pudo cargar el catálogo",
    };
  }
}

export async function previewQuoteAction(
  conversationId: string,
  request: QuotePreviewRequest,
  context: {
    businessName: string;
    customerName: string;
    customerPhone?: string | null;
  }
): Promise<
  | { ok: true; source: "backend"; preview: QuotePreview }
  | { ok: true; source: "unavailable" }
  | { ok: false; error: string }
> {
  await requireAppAccess();

  if (!conversationId.trim()) {
    return { ok: false, error: "Falta la conversación." };
  }
  if (!request.lines.length) {
    return { ok: false, error: "Selecciona al menos un producto." };
  }

  try {
    const raw = await botApi.previewConversationQuote(conversationId, request);
    return {
      ok: true,
      source: "backend",
      preview: normalizeQuotePreview(raw, {
        request,
        businessName: context.businessName,
        customerName: context.customerName,
        customerPhone: context.customerPhone,
      }),
    };
  } catch (error) {
    if (isQuoteEndpointUnavailable(error)) {
      return { ok: true, source: "unavailable" };
    }
    return {
      ok: false,
      error: getBotApiErrorMessage(error) || BOT_API_UNAVAILABLE_MESSAGE,
    };
  }
}

export async function generateQuotePdfAction(
  conversationId: string,
  request: QuotePreviewRequest
): Promise<
  | { ok: true; pdfBase64: string; filename: string; quoteNumber: string | null }
  | { ok: false; error: string; unavailable?: boolean }
> {
  await requireAppAccess();

  if (!conversationId.trim()) {
    return { ok: false, error: "Falta la conversación." };
  }
  if (!request.lines.length) {
    return { ok: false, error: "Selecciona al menos un producto." };
  }

  try {
    const pdf = await botApi.generateConversationQuotePdf(conversationId, request);
    return {
      ok: true,
      pdfBase64: pdf.base64,
      filename: pdf.filename,
      quoteNumber: pdf.quoteNumber,
    };
  } catch (error) {
    if (isQuoteEndpointUnavailable(error)) {
      return {
        ok: false,
        unavailable: true,
        error: QUOTE_PDF_UNAVAILABLE_MESSAGE,
      };
    }
    return {
      ok: false,
      error: getBotApiErrorMessage(error) || "No se pudo generar el PDF de la cotización",
    };
  }
}
