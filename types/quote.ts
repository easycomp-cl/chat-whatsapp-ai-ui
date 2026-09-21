export const QUOTE_MAX_LINES = 30;

export const QUOTE_PDF_UNAVAILABLE_MESSAGE =
  "La generación de PDF se activa cuando el backend publique cotizaciones";

export type QuoteDeliveryMethod = "none" | "pickup" | "delivery";

export type QuoteLineInput = {
  product_id: string;
  quantity: number;
};

export type QuotePreviewRequest = {
  lines: QuoteLineInput[];
  customer_note?: string;
  delivery_method: QuoteDeliveryMethod;
  commune?: string;
};

export type QuotePreviewLine = {
  product_id: string;
  sku: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type QuoteDelivery = {
  method: QuoteDeliveryMethod;
  label: string;
  price: number | null;
};

export type QuotePreview = {
  quote_number: string;
  business_name: string;
  customer_name: string;
  customer_phone: string | null;
  currency: string;
  customer_note: string | null;
  issued_at: string;
  delivery: QuoteDelivery;
  lines: QuotePreviewLine[];
  products_subtotal: number;
  delivery_price: number | null;
  net_amount: number;
  iva_amount: number;
  total: number;
  notes: string[];
  source: "backend" | "local";
};
