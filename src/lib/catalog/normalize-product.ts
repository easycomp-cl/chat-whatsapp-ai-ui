import type { CatalogProduct } from "@/lib/bot-api/types";

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

function pickBoolean(row: Record<string, unknown>, ...keys: string[]): boolean | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

export function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseCatalogSource(value: string | null): CatalogProduct["source"] {
  if (value === "CSV" || value === "JSON" || value === "SHOPIFY" || value === "MANUAL") {
    return value;
  }
  return "MANUAL";
}

function pickTags(row: Record<string, unknown>): string[] {
  const raw = row.tags;
  if (!Array.isArray(raw)) return [];
  return raw.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0);
}

export function normalizeCatalogProduct(raw: unknown): CatalogProduct | null {
  const row = asRecord(raw);
  if (!row) return null;

  const id = pickString(row, "id");
  const name = pickString(row, "name");
  if (!id || !name) return null;

  const metadata = asRecord(row.metadata) ?? {};

  return {
    id,
    tenantId: pickString(row, "tenantId", "tenant_id") ?? "",
    externalId: pickString(row, "externalId", "external_id"),
    sku: pickString(row, "sku"),
    name,
    description: pickString(row, "description"),
    price: toNullableNumber(row.price),
    currency: pickString(row, "currency") ?? "CLP",
    category: pickString(row, "category"),
    tags: pickTags(row),
    metadata,
    source: parseCatalogSource(pickString(row, "source")),
    isActive: pickBoolean(row, "isActive", "is_active") ?? true,
    createdAt: pickString(row, "createdAt", "created_at") ?? "",
    updatedAt: pickString(row, "updatedAt", "updated_at") ?? "",
  };
}

export function unwrapCatalogProducts(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const row = asRecord(raw);
  if (!row) return [];
  if (Array.isArray(row.products)) return row.products;
  if (Array.isArray(row.data)) return row.data;
  return [];
}

export function normalizeCatalogProducts(raw: unknown): CatalogProduct[] {
  return unwrapCatalogProducts(raw)
    .map(normalizeCatalogProduct)
    .filter((product): product is CatalogProduct => product != null);
}

export function catalogProductHasPrice(product: CatalogProduct): boolean {
  return product.price != null && Number.isFinite(product.price) && product.price >= 0;
}

export function catalogProductSearchHaystack(product: CatalogProduct): string {
  return [
    product.name,
    product.sku ?? "",
    product.category ?? "",
    product.description ?? "",
    ...product.tags,
  ]
    .join(" ")
    .toLowerCase();
}
