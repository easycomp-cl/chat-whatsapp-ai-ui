import type { CatalogProduct } from "@/lib/bot-api/types";
import { catalogProductHasPrice } from "@/lib/catalog/normalize-product";
import { formatQuoteDate, splitInclusiveIva } from "@/lib/quotes/format";
import type {
  QuoteDeliveryMethod,
  QuotePreview,
  QuotePreviewLine,
  QuotePreviewRequest,
} from "@/types/quote";

const DELIVERY_LABELS: Record<QuoteDeliveryMethod, string> = {
  none: "Sin definir",
  pickup: "Retiro en local",
  delivery: "Despacho",
};

export function parseQuoteDeliveryMethod(value: string | null | undefined): QuoteDeliveryMethod {
  if (value === "pickup" || value === "delivery" || value === "none") return value;
  return "none";
}

export function deliveryMethodLabel(
  method: QuoteDeliveryMethod,
  commune?: string | null
): string {
  if (method === "delivery") {
    const place = commune?.trim();
    return place ? `Despacho a ${place}` : "Despacho";
  }
  return DELIVERY_LABELS[method];
}

export function buildLocalQuotePreview(input: {
  request: QuotePreviewRequest;
  products: CatalogProduct[];
  businessName: string;
  customerName: string;
  customerPhone?: string | null;
}): QuotePreview {
  const byId = new Map(input.products.map((product) => [product.id, product]));
  const lines: QuotePreviewLine[] = [];

  for (const line of input.request.lines) {
    const product = byId.get(line.product_id);
    if (!product || !product.isActive || !catalogProductHasPrice(product)) continue;
    const quantity = Math.max(1, Math.floor(line.quantity));
    const unitPrice = product.price ?? 0;
    lines.push({
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      quantity,
      unit_price: unitPrice,
      line_total: unitPrice * quantity,
    });
  }

  const productsSubtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
  const method = input.request.delivery_method;
  const commune = input.request.commune?.trim() || null;
  const deliveryPrice = method === "delivery" ? null : 0;
  const { net, iva, total } = splitInclusiveIva(productsSubtotal + (deliveryPrice ?? 0));

  return {
    quote_number: "BORRADOR",
    business_name: input.businessName.trim() || "EasyComp Repuestos",
    customer_name: input.customerName,
    customer_phone: input.customerPhone?.trim() || null,
    currency: "CLP",
    customer_note: input.request.customer_note?.trim() || null,
    issued_at: formatQuoteDate(),
    delivery: {
      method,
      label: deliveryMethodLabel(method, commune),
      price: deliveryPrice,
    },
    lines,
    products_subtotal: productsSubtotal,
    delivery_price: deliveryPrice,
    net_amount: net,
    iva_amount: iva,
    total,
    notes: [],
    source: "local",
  };
}
