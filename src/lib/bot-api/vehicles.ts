export type VehicleLookupStatus =
  | "found"
  | "cached"
  | "invalid_plate"
  | "not_found"
  | "provider_not_configured";

export type VehicleCatalogMatch = "sku_hint" | "exact" | "compatible" | string;

export type VehicleFitmentProduct = {
  id: string;
  sku: string | null;
  name: string;
  price: number | null;
  part_type: string | null;
  part_label: string | null;
  in_stock: boolean;
  match: VehicleCatalogMatch;
};

export type VehicleFitmentResult = {
  compatible: VehicleFitmentProduct[];
  missing: Array<{ part_type?: string; part_label?: string; note?: string }>;
};

export type VehicleModelMatch = {
  make: string;
  make_slug?: string;
  model: string;
  slug?: string;
  year_from?: number | null;
  year_to?: number | null;
  engine?: string | null;
};

export type VehicleIdentity = {
  make?: string | null;
  model?: string | null;
  slug?: string | null;
  year_from?: number | null;
  year_to?: number | null;
  engine?: string | null;
};

export type VehiclePlateLookupResponse = {
  status: VehicleLookupStatus;
  plate: string;
  plate_display?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  engine?: string | null;
  color?: string | null;
  vin?: string | null;
  fuel?: string | null;
  version?: string | null;
  transmission?: string | null;
  vehicle_type?: string | null;
  provider_configured?: boolean;
  vehicle?: VehicleIdentity | null;
  fitment?: VehicleFitmentResult | null;
};

export type VehicleModelsResponse = {
  models: VehicleModelMatch[];
};

export type VehicleFitmentQuery = {
  plate?: string;
  make?: string;
  model?: string;
  year?: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function readBoolean(record: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function parseFitmentProduct(raw: unknown): VehicleFitmentProduct | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = readString(row, "id");
  const name = readString(row, "name");
  if (!id || !name) return null;
  return {
    id,
    sku: readString(row, "sku"),
    name,
    price: readNumber(row, "price"),
    part_type: readString(row, "part_type", "partType"),
    part_label: readString(row, "part_label", "partLabel"),
    in_stock: readBoolean(row, "in_stock", "inStock") ?? false,
    match: readString(row, "match") ?? "compatible",
  };
}

function parseFitment(raw: unknown): VehicleFitmentResult | null {
  const row = asRecord(raw);
  if (!row) return null;
  const compatible = Array.isArray(row.compatible)
    ? row.compatible.map(parseFitmentProduct).filter((item): item is VehicleFitmentProduct => Boolean(item))
    : [];
  const missing = Array.isArray(row.missing)
    ? row.missing
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => ({
          part_type: readString(item, "part_type", "partType") ?? undefined,
          part_label: readString(item, "part_label", "partLabel") ?? undefined,
          note: readString(item, "note") ?? undefined,
        }))
    : [];
  return { compatible, missing };
}

function parseVehicleIdentity(raw: unknown): VehicleIdentity | null {
  const row = asRecord(raw);
  if (!row) return null;
  return {
    make: readString(row, "make"),
    model: readString(row, "model"),
    slug: readString(row, "slug"),
    year_from: readNumber(row, "year_from", "yearFrom"),
    year_to: readNumber(row, "year_to", "yearTo"),
    engine: readString(row, "engine"),
  };
}

export function parseVehicleLookupStatus(value: unknown): VehicleLookupStatus {
  if (
    value === "found" ||
    value === "cached" ||
    value === "invalid_plate" ||
    value === "not_found" ||
    value === "provider_not_configured"
  ) {
    return value;
  }
  return "not_found";
}

export function parseVehiclePlateLookupResponse(raw: unknown): VehiclePlateLookupResponse {
  const row = asRecord(raw) ?? {};
  return {
    status: parseVehicleLookupStatus(row.status),
    plate: readString(row, "plate") ?? "",
    plate_display: readString(row, "plate_display", "plateDisplay"),
    make: readString(row, "make"),
    model: readString(row, "model"),
    year: readNumber(row, "year"),
    engine: readString(row, "engine"),
    color: readString(row, "color"),
    vin: readString(row, "vin"),
    fuel: readString(row, "fuel"),
    version: readString(row, "version"),
    transmission: readString(row, "transmission"),
    vehicle_type: readString(row, "vehicle_type", "vehicleType"),
    provider_configured: readBoolean(row, "provider_configured", "providerConfigured"),
    vehicle: parseVehicleIdentity(row.vehicle),
    fitment: parseFitment(row.fitment),
  };
}

export function parseVehicleFitmentResult(raw: unknown): VehicleFitmentResult {
  return parseFitment(raw) ?? { compatible: [], missing: [] };
}

export function parseVehicleModelsResponse(raw: unknown): VehicleModelsResponse {
  const row = asRecord(raw);
  const list = Array.isArray(raw) ? raw : Array.isArray(row?.models) ? row.models : [];
  const models: VehicleModelMatch[] = [];
  for (const item of list) {
    const record = asRecord(item);
    if (!record) continue;
    const make = readString(record, "make");
    const model = readString(record, "model");
    if (!make || !model) continue;
    models.push({
      make,
      make_slug: readString(record, "make_slug", "makeSlug") ?? undefined,
      model,
      slug: readString(record, "slug") ?? undefined,
      year_from: readNumber(record, "year_from", "yearFrom"),
      year_to: readNumber(record, "year_to", "yearTo"),
      engine: readString(record, "engine"),
    });
  }
  return { models };
}
