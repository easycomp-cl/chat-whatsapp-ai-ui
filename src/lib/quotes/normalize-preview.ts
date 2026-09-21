import { deliveryMethodLabel, parseQuoteDeliveryMethod } from "@/lib/quotes/build-preview";
import { formatQuoteDate, splitInclusiveIva } from "@/lib/quotes/format";
import { toNullableNumber } from "@/lib/catalog/normalize-product";
import type {
  QuoteDeliveryMethod,
  QuotePreview,
  QuotePreviewLine,
  QuotePreviewRequest,
} from "@/types/quote";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function pickNumber(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const parsed = toNullableNumber(row[key]);
    if (parsed != null) return parsed;
  }
  return null;
}

function normalizeLine(raw: unknown): QuotePreviewLine | null {
  const row = asRecord(raw);
  if (!row) return null;
  const productId = pickString(row, "product_id", "productId", "id");
  const name = pickString(row, "name");
  const quantity = pickNumber(row, "quantity") ?? 0;
  const unitPrice = pickNumber(row, "unit_price", "unitPrice") ?? 0;
  if (!productId || !name || quantity < 1) return null;
  return {
    product_id: productId,
    sku: pickString(row, "sku"),
    name,
    quantity: Math.floor(quantity),
    unit_price: unitPrice,
    line_total: pickNumber(row, "line_total", "lineTotal") ?? unitPrice * Math.floor(quantity),
  };
}

export function normalizeQuotePreview(
  raw: unknown,
  fallback: {
    request: QuotePreviewRequest;
    businessName: string;
    customerName: string;
    customerPhone?: string | null;
  }
): QuotePreview {
  const row = asRecord(raw) ?? {};
  const request = fallback.request;
  const method = parseQuoteDeliveryMethod(
    pickString(row, "delivery_method") ??
      (asRecord(row.delivery) ? pickString(asRecord(row.delivery)!, "method") : null) ??
      request.delivery_method
  );
  const commune =
    request.commune?.trim() ||
    pickString(row, "commune") ||
    (asRecord(row.delivery) ? pickString(asRecord(row.delivery)!, "commune") : null);

  const deliveryRow = asRecord(row.delivery);
  const deliveryPrice =
    pickNumber(row, "delivery_price", "deliveryPrice") ??
    (deliveryRow ? pickNumber(deliveryRow, "price") : null);

  const rawLines = Array.isArray(row.lines) ? row.lines : [];
  const lines = rawLines.map(normalizeLine).filter((line): line is QuotePreviewLine => line != null);
  const productsSubtotal =
    pickNumber(row, "products_subtotal", "productsSubtotal") ??
    lines.reduce((sum, line) => sum + line.line_total, 0);

  const notesRaw = row.notes;
  const notes = Array.isArray(notesRaw)
    ? notesRaw.filter((note): note is string => typeof note === "string" && note.trim().length > 0)
    : [];

  const resolvedMethod = parseQuoteDeliveryMethod(deliveryRow ? pickString(deliveryRow, "method") : method);
  const resolvedDeliveryPrice =
    resolvedMethod === "delivery" && deliveryPrice == null ? null : (deliveryPrice ?? 0);
  const total = pickNumber(row, "total") ?? productsSubtotal + (resolvedDeliveryPrice ?? 0);
  const split = splitInclusiveIva(total);
  const netAmount = pickNumber(row, "net_amount", "netAmount") ?? split.net;
  const ivaAmount = pickNumber(row, "iva_amount", "ivaAmount") ?? split.iva;

  return {
    quote_number: pickString(row, "quote_number", "quoteNumber") ?? "BORRADOR",
    business_name:
      pickString(row, "business_name", "businessName") ||
      fallback.businessName.trim() ||
      "EasyComp Repuestos",
    customer_name: pickString(row, "customer_name", "customerName") ?? fallback.customerName,
    customer_phone: fallback.customerPhone?.trim() || null,
    currency: pickString(row, "currency") ?? "CLP",
    customer_note:
      pickString(row, "customer_note", "customerNote") ?? request.customer_note?.trim() ?? null,
    issued_at: formatQuoteDate(),
    delivery: {
      method: resolvedMethod,
      label:
        (deliveryRow ? pickString(deliveryRow, "label") : null) ??
        deliveryMethodLabel(resolvedMethod, commune),
      price: resolvedDeliveryPrice,
    },
    lines,
    products_subtotal: productsSubtotal,
    delivery_price: resolvedDeliveryPrice,
    net_amount: netAmount,
    iva_amount: ivaAmount,
    total,
    notes,
    source: "backend",
  };
}

export function toQuotePreviewRequest(input: {
  lines: Array<{ productId: string; quantity: number }>;
  customerNote: string;
  deliveryMethod: QuoteDeliveryMethod;
  commune: string;
}): QuotePreviewRequest {
  const request: QuotePreviewRequest = {
    lines: input.lines.map((line) => ({
      product_id: line.productId,
      quantity: line.quantity,
    })),
    delivery_method: input.deliveryMethod,
  };
  const note = input.customerNote.trim();
  if (note) request.customer_note = note;
  if (input.deliveryMethod === "delivery") {
    const commune = input.commune.trim();
    if (commune) request.commune = commune;
  }
  return request;
}
