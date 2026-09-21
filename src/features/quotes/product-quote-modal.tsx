"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateQuotePdfAction } from "@/lib/actions/quote-actions";
import { getVehicleFitmentAction, searchVehicleModelsAction } from "@/lib/actions/vehicle-actions";
import type { CatalogProduct } from "@/lib/bot-api/types";
import {
  catalogProductHasPrice,
  catalogProductSearchHaystack,
} from "@/lib/catalog/normalize-product";
import { buildLocalQuotePreview, parseQuoteDeliveryMethod } from "@/lib/quotes/build-preview";
import { formatClp } from "@/lib/quotes/format";
import { toQuotePreviewRequest } from "@/lib/quotes/normalize-preview";
import { cn } from "@/lib/utils";
import {
  QUOTE_MAX_LINES,
  QUOTE_PDF_UNAVAILABLE_MESSAGE,
  type QuoteDeliveryMethod,
} from "@/types/quote";
import { ProductQuotePreview } from "@/features/quotes/product-quote-preview";
import { useCustomerGarage } from "@/features/conversations/hooks/use-customer-garage";
import {
  activeCustomerVehicle,
  compactPlate,
  isChileanPlate,
  vehicleFilterQuery,
} from "@/lib/customers/vehicle";

const PREFERRED_CATEGORIES = [
  "Aceites",
  "Filtros",
  "Escobillas",
  "Ampolletas",
  "Frenos",
  "Bujías",
];

const UNCATEGORIZED = "Sin categoría";

type ProductQuoteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  customerId?: string | null;
  businessName: string;
  customerName: string;
  customerPhone?: string | null;
  defaultCommune?: string | null;
  products: CatalogProduct[];
  productsLoading?: boolean;
  productsError?: string | null;
  onAttach: (file: File) => void;
};

function parseMakeModelYear(raw: string): { make?: string; model?: string; year?: number } {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  let year: number | undefined;
  const last = parts.at(-1);
  if (last && /^\d{4}$/.test(last)) {
    year = Number(last);
    parts.pop();
  }
  if (parts.length === 0) return { year };
  if (parts.length === 1) return { model: parts[0], year };
  return { make: parts[0], model: parts.slice(1).join(" "), year };
}

function fileFromPdfBase64(base64: string, filename: string): File {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: "application/pdf" });
}

function categoryRank(name: string): number {
  const index = PREFERRED_CATEGORIES.findIndex(
    (category) => category.toLowerCase() === name.toLowerCase()
  );
  if (index >= 0) return index;
  if (name === UNCATEGORIZED) return PREFERRED_CATEGORIES.length + 1;
  return PREFERRED_CATEGORIES.length;
}

export function ProductQuoteModal({
  open,
  onOpenChange,
  conversationId,
  customerId = null,
  businessName,
  customerName,
  customerPhone,
  defaultCommune = null,
  products,
  productsLoading = false,
  productsError = null,
  onAttach,
}: ProductQuoteModalProps) {
  const [query, setQuery] = useState("");
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [compatibleSkus, setCompatibleSkus] = useState<string[] | null>(null);
  const [fitmentWarning, setFitmentWarning] = useState<string | null>(null);
  const [fitmentPending, setFitmentPending] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<QuoteDeliveryMethod>("none");
  const [commune, setCommune] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pdfUnavailable, setPdfUnavailable] = useState(false);
  const [attachPending, setAttachPending] = useState(false);
  const { garage } = useCustomerGarage(open ? customerId : null);

  const selectedCount = Object.keys(quantities).length;

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDeliveryMethod("none");
    setCommune(defaultCommune?.trim() ?? "");
    setQuantities({});
    setPdfUnavailable(false);
    setAttachPending(false);
    setCompatibleSkus(null);
    setFitmentWarning(null);
    setFitmentPending(false);
  }, [open, conversationId, defaultCommune]);

  async function applyVehicleFilter(raw: string) {
    const value = raw.trim();
    if (!value) {
      setCompatibleSkus(null);
      setFitmentWarning(null);
      return;
    }

    setFitmentPending(true);
    try {
      const parsed = parseMakeModelYear(value);
      let result = isChileanPlate(value)
        ? await getVehicleFitmentAction({ plate: compactPlate(value) })
        : parsed.make && parsed.model
          ? await getVehicleFitmentAction({
              make: parsed.make,
              model: parsed.model,
              year: parsed.year,
            })
          : null;

      if (!result && !isChileanPlate(value)) {
        const models = await searchVehicleModelsAction(value);
        if (models.ok && models.models[0]) {
          const match = models.models[0];
          result = await getVehicleFitmentAction({
            make: match.make,
            model: match.model,
            year: parsed.year ?? match.year_from ?? undefined,
          });
        }
      }

      if (!result) {
        setCompatibleSkus(null);
        setFitmentWarning(
          "No encontramos ese vehículo. Mostramos el catálogo completo (base beta, no confirmado)."
        );
        return;
      }

      if (!result.ok) {
        setCompatibleSkus(null);
        setFitmentWarning(result.error);
        return;
      }

      const skus = result.fitment.compatible
        .map((item) => item.sku)
        .filter((sku): sku is string => Boolean(sku));
      if (skus.length === 0) {
        setCompatibleSkus(null);
        setFitmentWarning("Base beta, no confirmado: no hay SKUs compatibles, se muestra el catálogo completo.");
        return;
      }

      setCompatibleSkus(skus);
      setFitmentWarning(null);
    } finally {
      setFitmentPending(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const prefill = vehicleFilterQuery(activeCustomerVehicle(garage));
    setVehicleQuery(prefill);
    if (prefill) void applyVehicleFilter(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill when garage arrives
  }, [open, garage?.active_vehicle_key, garage?.vehicles.length]);

  const compatibleSkuSet = useMemo(() => (compatibleSkus ? new Set(compatibleSkus) : null), [compatibleSkus]);
  const catalogForQuote = useMemo(() => {
    if (!compatibleSkuSet || compatibleSkuSet.size === 0) return products;
    return products.filter((product) => product.sku && compatibleSkuSet.has(product.sku));
  }, [products, compatibleSkuSet]);

  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = catalogForQuote.filter((product) => {
      if (!needle) return true;
      return catalogProductSearchHaystack(product).includes(needle);
    });

    const buckets = new Map<string, CatalogProduct[]>();
    for (const product of filtered) {
      const category = product.category?.trim() || UNCATEGORIZED;
      const list = buckets.get(category);
      if (list) list.push(product);
      else buckets.set(category, [product]);
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => {
        const rankDiff = categoryRank(a) - categoryRank(b);
        if (rankDiff !== 0) return rankDiff;
        return a.localeCompare(b, "es");
      })
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) => a.name.localeCompare(b.name, "es")),
      }));
  }, [catalogForQuote, query]);

  const selectedLines = useMemo(
    () =>
      Object.entries(quantities).map(([productId, quantity]) => ({
        productId,
        quantity,
      })),
    [quantities]
  );

  function selectedRequest() {
    return toQuotePreviewRequest({
      lines: selectedLines,
      customerNote: "",
      deliveryMethod,
      commune,
    });
  }

  function localPreviewFromSelection() {
    return buildLocalQuotePreview({
      request: selectedRequest(),
      products,
      businessName,
      customerName,
      customerPhone,
    });
  }

  function toggleProduct(product: CatalogProduct) {
    if (!catalogProductHasPrice(product) || !product.isActive) return;
    if (!quantities[product.id] && selectedCount >= QUOTE_MAX_LINES) {
      toast.error(`Máximo ${QUOTE_MAX_LINES} líneas en la cotización`);
      return;
    }

    setQuantities((current) => {
      if (current[product.id]) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }
      return { ...current, [product.id]: 1 };
    });
  }

  function setQuantity(productId: string, raw: string) {
    const parsed = Number.parseInt(raw, 10);
    const quantity = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
    setQuantities((current) => {
      if (!current[productId]) return current;
      return { ...current, [productId]: quantity };
    });
  }

  async function handleAttach() {
    if (selectedCount === 0) {
      toast.error("Selecciona al menos un producto.");
      return;
    }
    if (pdfUnavailable) return;

    setAttachPending(true);
    try {
      const result = await generateQuotePdfAction(conversationId, selectedRequest());
      if (!result.ok) {
        if (result.unavailable) {
          setPdfUnavailable(true);
        }
        toast.error(result.error);
        return;
      }
      const file = fileFromPdfBase64(result.pdfBase64, result.filename);
      onAttach(file);
      onOpenChange(false);
      toast.success("Cotización lista en el composer. Escribe el texto y envía.");
    } catch {
      toast.error("No se pudo generar el PDF de la cotización.");
    } finally {
      setAttachPending(false);
    }
  }

  const visiblePreview = selectedCount > 0 ? localPreviewFromSelection() : null;
  const busy = attachPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,52rem)] w-full flex-col gap-3 overflow-hidden sm:max-w-5xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Cotización de productos</DialogTitle>
          <DialogDescription>
            {customerName}
            {businessName ? ` · ${businessName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="quote-delivery">Entrega</Label>
                <Select
                  value={deliveryMethod}
                  onValueChange={(value) => setDeliveryMethod(parseQuoteDeliveryMethod(value))}
                  disabled={busy}
                >
                  <SelectTrigger id="quote-delivery" className="w-full">
                    <SelectValue placeholder="Sin definir">
                      {deliveryMethod === "pickup"
                        ? "Retiro en local"
                        : deliveryMethod === "delivery"
                          ? "Despacho"
                          : "Sin definir"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin definir</SelectItem>
                    <SelectItem value="pickup">Retiro en local</SelectItem>
                    <SelectItem value="delivery">Despacho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {deliveryMethod === "delivery" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="quote-commune">Comuna</Label>
                  <Input
                    id="quote-commune"
                    value={commune}
                    onChange={(event) => setCommune(event.target.value)}
                    placeholder="Maipú"
                    disabled={busy}
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quote-vehicle">Vehículo / patente</Label>
              <div className="flex gap-2">
                <Input
                  id="quote-vehicle"
                  value={vehicleQuery}
                  onChange={(event) => setVehicleQuery(event.target.value)}
                  onBlur={() => {
                    void applyVehicleFilter(vehicleQuery);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void applyVehicleFilter(vehicleQuery);
                    }
                  }}
                  placeholder="BB BB 12 o Toyota Hilux 2018"
                  disabled={busy || fitmentPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={busy || fitmentPending}
                  onClick={() => void applyVehicleFilter(vehicleQuery)}
                >
                  {fitmentPending ? "Filtrando…" : "Filtrar"}
                </Button>
              </div>
              {fitmentWarning ? (
                <p className="text-[11px] text-amber-800">{fitmentWarning}</p>
              ) : compatibleSkuSet && compatibleSkuSet.size > 0 ? (
                <p className="text-[11px] text-[#1e3a5f]">
                  Mostrando {compatibleSkuSet.size} SKU{compatibleSkuSet.size === 1 ? "" : "s"} compatible
                  {compatibleSkuSet.size === 1 ? "" : "s"}.
                </p>
              ) : null}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, SKU, categoría o tag…"
                className="pl-8"
                aria-label="Buscar productos"
                disabled={busy}
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              {selectedCount}/{QUOTE_MAX_LINES} líneas
            </p>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border pr-1">
              {productsLoading ? (
                <div className="flex items-center gap-2 px-3 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando catálogo…
                </div>
              ) : productsError ? (
                <p className="px-3 py-10 text-sm text-destructive">{productsError}</p>
              ) : grouped.length === 0 ? (
                <p className="px-3 py-10 text-sm text-muted-foreground">
                  {catalogForQuote.length === 0
                    ? (
                      products.length === 0 ? (
                      <>
                        Este negocio no tiene productos en el catálogo. Impórtalos en{" "}
                        <Link href="/app/catalog" className="font-medium text-[#0d9488] underline">
                          Catálogo
                        </Link>
                        .
                      </>
                      ) : (
                        "Ningún producto del catálogo coincide con el vehículo. Se puede limpiar el filtro para ver todo."
                      )
                    )
                    : `Ningún producto coincide con “${query.trim()}”.`}
                </p>
              ) : (
                grouped.map((group) => (
                  <section key={group.category} className="border-b last:border-b-0">
                    <h3 className="sticky top-0 z-10 bg-muted/90 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur-sm">
                      {group.category}
                    </h3>
                    <ul>
                      {group.items.map((product) => {
                        const selectable = catalogProductHasPrice(product) && product.isActive;
                        const selected = Boolean(quantities[product.id]);
                        const quantity = quantities[product.id] ?? 1;
                        const unit = product.price ?? 0;
                        return (
                          <li key={product.id}>
                            <div
                              className={cn(
                                "flex items-start gap-3 px-3 py-2",
                                selected ? "bg-[#e7f8f3]" : "hover:bg-muted/50",
                                !selectable ? "opacity-60" : ""
                              )}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 size-3.5 rounded border-[#d1d7db] accent-[#00a884]"
                                checked={selected}
                                disabled={!selectable || busy}
                                onChange={() => toggleProduct(product)}
                                aria-label={`Seleccionar ${product.name}`}
                              />
                              <button
                                type="button"
                                className="min-w-0 flex-1 text-left"
                                disabled={!selectable || busy}
                                onClick={() => toggleProduct(product)}
                              >
                                <p className="text-sm font-medium">{product.name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {[product.sku, selectable ? formatClp(unit) : null]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              </button>
                              <div className="flex shrink-0 items-center gap-2">
                                {!product.isActive ? (
                                  <Badge variant="outline">Inactivo</Badge>
                                ) : !catalogProductHasPrice(product) ? (
                                  <Badge variant="secondary">Sin precio</Badge>
                                ) : selected ? (
                                  <>
                                    <Input
                                      type="number"
                                      min={1}
                                      step={1}
                                      value={quantity}
                                      onChange={(event) => setQuantity(product.id, event.target.value)}
                                      className="h-7 w-16 text-right"
                                      aria-label={`Cantidad de ${product.name}`}
                                      disabled={busy}
                                    />
                                    <span className="w-19 text-right text-xs tabular-nums">
                                      {formatClp(unit * quantity)}
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto rounded-lg bg-[#efeae2] p-3">
            {visiblePreview ? (
              <ProductQuotePreview preview={visiblePreview} />
            ) : (
              <p className="px-2 py-10 text-center text-sm text-muted-foreground">
                Marca productos para ver la hoja.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:items-center sm:justify-between">
          <p className="me-auto text-[11px] text-muted-foreground">
            {pdfUnavailable
              ? QUOTE_PDF_UNAVAILABLE_MESSAGE
              : "Adjuntar deja el PDF en el composer. No lo envía a WhatsApp."}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleAttach()}
              disabled={busy || selectedCount === 0 || pdfUnavailable || Boolean(productsError)}
              title={pdfUnavailable ? QUOTE_PDF_UNAVAILABLE_MESSAGE : undefined}
            >
              {attachPending ? "Adjuntando…" : "Adjuntar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
