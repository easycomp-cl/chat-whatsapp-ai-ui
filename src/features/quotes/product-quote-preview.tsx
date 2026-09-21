import { formatClp } from "@/lib/quotes/format";
import { cn } from "@/lib/utils";
import type { QuotePreview } from "@/types/quote";

type ProductQuotePreviewProps = {
  preview: QuotePreview;
  className?: string;
};

export function ProductQuotePreview({ preview, className }: ProductQuotePreviewProps) {
  return (
    <article
      className={cn(
        "rounded-sm bg-white text-[#1a1a1a] shadow-sm ring-1 ring-black/10",
        "px-5 py-4 text-[11px] leading-snug",
        className
      )}
    >
      <header className="border-b border-neutral-200 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">{preview.business_name}</p>
            <p className="mt-0.5 text-[10px] tracking-wide text-neutral-500 uppercase">
              Cotización
            </p>
          </div>
          <p className="shrink-0 text-neutral-500">{preview.issued_at}</p>
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-neutral-700">
          <p>
            <span className="text-neutral-500">Cliente:</span> {preview.customer_name}
          </p>
          {preview.customer_phone ? (
            <p>
              <span className="text-neutral-500">WhatsApp:</span> {preview.customer_phone}
            </p>
          ) : null}
        </div>
        {preview.customer_note ? (
          <p className="mt-1 text-neutral-600">
            <span className="text-neutral-500">Obs. vehículo:</span> {preview.customer_note}
          </p>
        ) : null}
      </header>

      {preview.lines.length === 0 ? (
        <p className="py-6 text-center text-neutral-500">Selecciona productos para ver el preview.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-[10px] tracking-wide text-neutral-500 uppercase">
                <th className="py-1.5 pr-2 font-medium">SKU</th>
                <th className="py-1.5 pr-2 font-medium">Producto</th>
                <th className="py-1.5 pr-2 text-right font-medium">Cant.</th>
                <th className="py-1.5 pr-2 text-right font-medium">P. unit.</th>
                <th className="py-1.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {preview.lines.map((line) => (
                <tr key={line.product_id} className="border-b border-neutral-100">
                  <td className="py-1.5 pr-2 font-mono text-[10px] whitespace-nowrap text-neutral-600">
                    {line.sku ?? "—"}
                  </td>
                  <td className="max-w-56 py-1.5 pr-2 whitespace-normal">{line.name}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{line.quantity}</td>
                  <td className="py-1.5 pr-2 text-right whitespace-nowrap tabular-nums">
                    {formatClp(line.unit_price)}
                  </td>
                  <td className="py-1.5 text-right whitespace-nowrap tabular-nums">
                    {formatClp(line.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dl className="mt-3 space-y-1 border-t border-neutral-200 pt-3">
        {preview.delivery.method === "delivery" && preview.delivery.price == null ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Entrega: {preview.delivery.label}</dt>
            <dd className="tabular-nums">Flete a confirmar</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">Valor neto</dt>
          <dd className="tabular-nums">{formatClp(preview.net_amount)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">IVA</dt>
          <dd className="tabular-nums">{formatClp(preview.iva_amount)}</dd>
        </div>
        <div className="flex justify-between gap-4 pt-1 text-sm font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatClp(preview.total)}</dd>
        </div>
      </dl>
    </article>
  );
}
