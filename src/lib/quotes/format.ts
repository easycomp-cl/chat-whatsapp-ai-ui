const CLP_FORMATTER = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const QUOTE_IVA_RATE = 0.19;

export function formatClp(amount: number): string {
  return CLP_FORMATTER.format(Math.round(amount));
}

/** Precios de catálogo van con IVA incluido. Neto + IVA = total bruto. */
export function splitInclusiveIva(gross: number): { net: number; iva: number; total: number } {
  const total = Math.round(Math.max(0, gross));
  const net = Math.round(total / (1 + QUOTE_IVA_RATE));
  return { net, iva: total - net, total };
}

export function formatQuoteDate(date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}
