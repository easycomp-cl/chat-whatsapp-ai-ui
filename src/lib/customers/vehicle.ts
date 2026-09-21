import type {
  CustomerGarage,
  CustomerVehicle,
  ProductHistoryItem,
  ProductHistorySource,
} from "@/types/message";

export type PlateCategory = "auto" | "moto";

export type PlateEntry = {
  compact: string;
  display: string;
  category: PlateCategory | null;
  complete: boolean;
  /** Texto corto cuando el formato aún no cierra o no es válido. */
  formatError: string | null;
};

/** Patentes chilenas vigentes y formatos publicados en Diario Oficial (ene 2026). */
const PLATE_PATTERNS: Array<{
  re: RegExp;
  category: PlateCategory;
  label: string;
}> = [
  { re: /^[A-Z]{2}\d{4}$/, category: "auto", label: "auto antiguo" },
  { re: /^[A-Z]{4}\d{2}$/, category: "auto", label: "auto" },
  { re: /^[A-Z]{5}\d$/, category: "auto", label: "auto nuevo" },
  { re: /^[A-Z]{2}\d{3}$/, category: "moto", label: "moto antigua" },
  { re: /^[A-Z]{3}\d{2}$/, category: "moto", label: "moto" },
  { re: /^[A-Z]{4}\d$/, category: "moto", label: "moto nueva" },
];

export function compactPlate(value: string | null | undefined): string {
  return (value ?? "").replace(/[\s.-]/g, "").toUpperCase();
}

function maxLettersForInput(): number {
  return 5;
}

function maxDigitsForLetters(letterCount: number): number {
  if (letterCount >= 5) return 1;
  if (letterCount === 4) return 2;
  if (letterCount === 3) return 2;
  if (letterCount === 2) return 4;
  return 0;
}

function splitPlateChars(raw: string): { letters: string; digits: string } {
  const source = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  let letters = "";
  let digits = "";
  for (const char of source) {
    if (char >= "A" && char <= "Z") {
      if (digits.length > 0 || letters.length >= maxLettersForInput()) continue;
      letters += char;
      continue;
    }
    if (letters.length < 2) continue;
    if (digits.length >= maxDigitsForLetters(letters.length)) continue;
    digits += char;
  }
  return { letters, digits };
}

function matchPlatePattern(compact: string) {
  return PLATE_PATTERNS.find((pattern) => pattern.re.test(compact)) ?? null;
}

function plateHint(letters: string, digits: string): PlateCategory | null {
  const matched = matchPlatePattern(`${letters}${digits}`);
  if (matched) return matched.category;
  if (letters.length === 5) return "auto";
  if (letters.length === 4 && digits.length === 1) return "moto";
  if (letters.length === 4) return "auto";
  if (letters.length === 3) return "moto";
  if (letters.length === 2 && digits.length >= 3) return digits.length === 3 ? "moto" : "auto";
  return null;
}

function groupPlate(letters: string, digits: string): string {
  if (!letters) return "";
  if (letters.length === 5) {
    return [letters, digits].filter(Boolean).join(" ");
  }
  if (letters.length === 4 && digits.length === 1) {
    return `${letters} ${digits}`;
  }
  if (letters.length === 4) {
    return [letters.slice(0, 2), letters.slice(2), digits].filter(Boolean).join(" ");
  }
  if (letters.length === 2 && digits.length === 4) {
    return `${letters} ${digits.slice(0, 2)} ${digits.slice(2)}`;
  }
  if (!digits) return letters;
  return `${letters} ${digits}`;
}

function plateFormatError(letters: string, digits: string, complete: boolean): string | null {
  if (complete) return null;
  const typed = `${letters}${digits}`;
  if (!typed) return null;
  if (letters.length < 2) {
    return "La patente debe empezar con al menos 2 letras.";
  }
  if (letters.length === 2 && digits.length > 0 && digits.length < 3) {
    return "Faltan dígitos. Auto: 4 dígitos. Moto antigua: 3 dígitos.";
  }
  if (letters.length === 3 && digits.length < 2) {
    return "Moto: 3 letras y 2 dígitos (ej. ABC 12).";
  }
  if (letters.length === 4 && digits.length === 0) {
    return "Auto: 2 dígitos. Moto nueva: 1 dígito.";
  }
  if (letters.length === 5 && digits.length === 0) {
    return "Auto nuevo: 5 letras y 1 dígito (ej. BBBBB 0).";
  }
  return "Formato de patente no válido para auto o moto en Chile.";
}

export function formatPlateEntry(raw: string | null | undefined): PlateEntry {
  const { letters, digits } = splitPlateChars(raw ?? "");
  const compact = `${letters}${digits}`;
  // Evita falsos positivos (ej. "1.6 LUXURY 4X2…") que al filtrar letras sueltas parecen patente.
  const fullCompact = compactPlate(raw);
  const matched = fullCompact === compact ? matchPlatePattern(compact) : null;
  const complete = matched !== null;
  return {
    compact,
    display: groupPlate(letters, digits),
    category: matched?.category ?? plateHint(letters, digits),
    complete,
    formatError: plateFormatError(letters, digits, complete),
  };
}

export function isChileanPlate(value: string | null | undefined): boolean {
  return matchPlatePattern(compactPlate(value)) !== null;
}

export function formatPlateDisplay(value: string | null | undefined): string {
  const entry = formatPlateEntry(value);
  return entry.display || compactPlate(value);
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  AUTOMOVIL: "Automóvil",
  AUTO: "Automóvil",
  "STATION WAGON": "Station wagon",
  STATIONWAGON: "Station wagon",
  CAMIONETA: "Camioneta",
  CAMION: "Camión",
  FURGON: "Furgón",
  MOTO: "Motocicleta",
  MOTOCICLETA: "Motocicleta",
};

export function vehicleTypeLabel(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  return VEHICLE_TYPE_LABELS[raw.toUpperCase()] ?? raw;
}

export function plateCategoryFromType(value: string | null | undefined): PlateCategory | null {
  const raw = (value ?? "").toUpperCase();
  if (raw.includes("MOTO")) return "moto";
  if (!raw) return null;
  return "auto";
}

export function vehicleFactRows(input: {
  plate?: string | null;
  plateDisplay?: string | null;
  make?: string | null;
  model?: string | null;
  year?: string | number | null;
  version?: string | null;
  color?: string | null;
  fuel?: string | null;
  transmission?: string | null;
  engine?: string | null;
  vin?: string | null;
  vehicleType?: string | null;
}): Array<{ label: string; value: string }> {
  const year =
    typeof input.year === "number" && Number.isFinite(input.year)
      ? String(input.year)
      : typeof input.year === "string"
        ? input.year.trim()
        : "";
  const plate =
    input.plateDisplay?.trim() ||
    (input.plate?.trim() ? formatPlateDisplay(input.plate) : "");
  const tipo = vehicleTypeLabel(input.vehicleType);
  const pairs: Array<[string, string]> = [
    ["Patente", plate],
    ["Marca", input.make?.trim() ?? ""],
    ["Modelo", input.model?.trim() ?? ""],
    ["Año", year],
    ["Versión", input.version?.trim() ?? ""],
    ["Color", input.color?.trim() ?? ""],
    ["Combustible", input.fuel?.trim() ?? ""],
    ["Transmisión", input.transmission?.trim() ?? ""],
    ["Motor", input.engine?.trim() ?? ""],
    ["VIN", input.vin?.trim() ?? ""],
    ["Tipo", tipo],
  ];
  return pairs.filter((pair) => pair[1]).map(([label, value]) => ({ label, value }));
}

const KNOWN_VEHICLE_TYPES = new Set([
  "AUTOMOVIL",
  "AUTO",
  "STATION WAGON",
  "STATIONWAGON",
  "CAMIONETA",
  "CAMION",
  "FURGON",
  "MOTO",
  "MOTOCICLETA",
  "JEEP",
  "BUS",
  "TRACTOR",
]);

const TRANSMISSION_WORDS = new Set([
  "MANUAL",
  "MECANICA",
  "MECÁNICA",
  "AUTOMATICA",
  "AUTOMÁTICA",
  "AUTOMATICO",
  "AUTOMÁTICO",
  "CVT",
]);

/**
 * Parsea el body compacto que arma el backend:
 * `MAKE MODEL YEAR · PLATE · VERSION · TYPE · motor X · TRANSMISSION · COLOR · VIN X`
 */
export function parseVehicleCardBodyText(body: string | null | undefined): {
  plate?: string;
  plateDisplay?: string;
  make?: string;
  model?: string;
  year?: number;
  version?: string;
  color?: string;
  fuel?: string;
  transmission?: string;
  engine?: string;
  vin?: string;
  vehicleType?: string;
} {
  const text = (body ?? "").replace(/\s+/g, " ").trim();
  if (!text) return {};

  const parts = text
    .split(/\s*·\s*|\s*\|\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return {};

  const result: {
    plate?: string;
    plateDisplay?: string;
    make?: string;
    model?: string;
    year?: number;
    version?: string;
    color?: string;
    fuel?: string;
    transmission?: string;
    engine?: string;
    vin?: string;
    vehicleType?: string;
  } = {};

  const remaining: string[] = [];

  for (const part of parts) {
    const upper = part.toUpperCase();
    const motorMatch = part.match(/^motor\s+(.+)$/i);
    if (motorMatch) {
      result.engine = motorMatch[1].trim();
      continue;
    }
    const vinMatch = part.match(/^vin\s+(.+)$/i);
    if (vinMatch) {
      result.vin = vinMatch[1].trim();
      continue;
    }
    if (!result.plate && isChileanPlate(part)) {
      result.plate = compactPlate(part);
      result.plateDisplay = formatPlateDisplay(part);
      continue;
    }
    if (KNOWN_VEHICLE_TYPES.has(upper) || KNOWN_VEHICLE_TYPES.has(upper.replace(/\s+/g, ""))) {
      result.vehicleType = part;
      continue;
    }
    if (TRANSMISSION_WORDS.has(upper)) {
      result.transmission = part;
      continue;
    }
    remaining.push(part);
  }

  if (remaining.length > 0) {
    const headline = remaining[0];
    const yearMatch = headline.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      result.year = Number(yearMatch[0]);
      const withoutYear = headline.replace(yearMatch[0], " ").replace(/\s+/g, " ").trim();
      const tokens = withoutYear.split(" ").filter(Boolean);
      if (tokens.length >= 1) result.make = tokens[0];
      if (tokens.length >= 2) result.model = tokens.slice(1).join(" ");
    } else {
      const tokens = headline.split(" ").filter(Boolean);
      if (tokens.length >= 1) result.make = tokens[0];
      if (tokens.length >= 2) result.model = tokens.slice(1).join(" ");
    }
    remaining.shift();
  }

  if (remaining.length > 0 && !result.version) {
    result.version = remaining.shift();
  }
  if (remaining.length > 0 && !result.color) {
    result.color = remaining.shift();
  }
  if (remaining.length > 0 && !result.fuel) {
    result.fuel = remaining.join(" · ");
  }

  return result;
}

export function vehicleLabel(vehicle: Pick<CustomerVehicle, "plate" | "make" | "model" | "year" | "engine">): string {
  const identity = [vehicle.make, vehicle.model, vehicle.year ? String(vehicle.year) : ""]
    .map((part) => part?.toString().trim())
    .filter(Boolean)
    .join(" ");
  const plate = vehicle.plate ? formatPlateDisplay(vehicle.plate) : "";
  if (plate && identity) return `${plate} · ${identity}`;
  return plate || identity || "Vehículo";
}

export function vehicleDetailRows(vehicle: CustomerVehicle): Array<{ label: string; value: string }> {
  return [
    ...vehicleFactRows({
      plate: vehicle.plate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      version: vehicle.version,
      color: vehicle.color,
      fuel: vehicle.fuel,
      engine: vehicle.engine,
      vin: vehicle.vin,
    }),
    ...(vehicle.source?.trim()
      ? [{ label: "Origen", value: vehicle.source.trim() }]
      : []),
    ...(vehicle.last_seen_at
      ? [{ label: "Última vez", value: vehicle.last_seen_at }]
      : []),
  ];
}

export function productHistoryIdentity(item: Pick<ProductHistoryItem, "product_id" | "sku" | "name">): string {
  return (item.product_id ?? item.sku ?? item.name).trim().toLowerCase();
}

export function productHistoryDetailRows(
  item: ProductHistoryItem
): Array<{ label: string; value: string }> {
  const pairs: Array<[string, string]> = [
    ["Nombre", item.name?.trim() ?? ""],
    ["SKU", item.sku?.trim() ?? ""],
    ["ID producto", item.product_id?.trim() ?? ""],
    ["Cantidad", item.quantity != null ? String(item.quantity) : ""],
    ["Fuente", item.source?.trim() ?? ""],
    ["Vehículo", item.vehicle_key?.trim() ?? ""],
    ["Fecha", item.at?.trim() ?? ""],
  ];
  return pairs.filter((pair) => pair[1]).map(([label, value]) => ({ label, value }));
}

const PRODUCT_SOURCE_LABELS: Record<string, string> = {
  chat: "Chat",
  quote: "Cotización",
  recommendation: "Recomendación",
  purchase: "Compra",
};

export function productHistorySourceLabel(source: string | null | undefined): string {
  const raw = (source ?? "").trim();
  if (!raw) return "";
  return PRODUCT_SOURCE_LABELS[raw] ?? raw;
}

export function removeGarageVehicle(
  garage: CustomerGarage,
  vehicleKey: string
): CustomerGarage {
  const vehicles = garage.vehicles.filter((vehicle) => vehicle.key !== vehicleKey);
  const activeStillThere = vehicles.some((vehicle) => vehicle.key === garage.active_vehicle_key);
  return {
    ...garage,
    vehicles,
    active_vehicle_key: activeStillThere
      ? garage.active_vehicle_key
      : vehicles[0]?.key ?? null,
  };
}

export type GarageProductBucket = "consulted" | "quoted" | "purchased";

export function removeGarageProduct(
  garage: CustomerGarage,
  bucket: GarageProductBucket,
  identity: string
): CustomerGarage {
  const needle = identity.trim().toLowerCase();
  const filterList = (items: ProductHistoryItem[]) =>
    items.filter((item) => productHistoryIdentity(item) !== needle);

  if (bucket === "consulted") {
    return { ...garage, products_consulted: filterList(garage.products_consulted) };
  }
  if (bucket === "quoted") {
    return { ...garage, products_quoted: filterList(garage.products_quoted) };
  }
  return { ...garage, products_purchased: filterList(garage.products_purchased) };
}

/** Metadatos de garage listos para PATCH (reemplaza solo estas claves). */
export function garageToProfileMetadataPatch(garage: CustomerGarage): Record<string, unknown> {
  const active =
    garage.vehicles.find((vehicle) => vehicle.key === garage.active_vehicle_key) ??
    garage.vehicles[0] ??
    null;
  return {
    vehicles: garage.vehicles,
    active_vehicle_key: garage.active_vehicle_key,
    active_vehicle_plate: active?.plate ?? null,
    active_vehicle: active
      ? {
          make: active.make ?? null,
          model: active.model ?? null,
          year: active.year ?? null,
          engine: active.engine ?? null,
          plate: active.plate ?? null,
          vin: active.vin ?? null,
          source: active.source,
        }
      : null,
    products_consulted: garage.products_consulted,
    products_quoted: garage.products_quoted,
    products_purchased: garage.products_purchased,
  };
}

export function activeCustomerVehicle(garage: CustomerGarage | null | undefined): CustomerVehicle | null {
  if (!garage?.vehicles.length) return null;
  if (garage.active_vehicle_key) {
    const active = garage.vehicles.find((vehicle) => vehicle.key === garage.active_vehicle_key);
    if (active) return active;
  }
  return garage.vehicles[0] ?? null;
}

export function vehicleFilterQuery(vehicle: CustomerVehicle | null | undefined): string {
  if (!vehicle) return "";
  if (vehicle.plate) return formatPlateDisplay(vehicle.plate);
  return [vehicle.make, vehicle.model, vehicle.year ? String(vehicle.year) : ""]
    .filter(Boolean)
    .join(" ");
}

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

function readNumber(record: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function parseHistorySource(value: unknown): ProductHistorySource {
  if (value === "quote" || value === "recommendation" || value === "purchase") return value;
  return "chat";
}

function parseProductHistory(raw: unknown): ProductHistoryItem[] {
  if (!Array.isArray(raw)) return [];
  const items: ProductHistoryItem[] = [];
  for (const entry of raw) {
    const row = asRecord(entry);
    if (!row) continue;
    const name = readString(row, "name");
    if (!name) continue;
    items.push({
      product_id: readString(row, "product_id", "productId") ?? undefined,
      sku: readString(row, "sku") ?? undefined,
      name,
      quantity: readNumber(row, "quantity"),
      vehicle_key: readString(row, "vehicle_key", "vehicleKey") ?? undefined,
      source: parseHistorySource(row.source),
      at: readString(row, "at") ?? "",
    });
  }
  return items;
}

function parseVehicle(raw: unknown): CustomerVehicle | null {
  const row = asRecord(raw);
  if (!row) return null;
  const key = readString(row, "key");
  if (!key) return null;
  return {
    key,
    plate: readString(row, "plate") ?? undefined,
    vin: readString(row, "vin") ?? undefined,
    make: readString(row, "make") ?? undefined,
    model: readString(row, "model") ?? undefined,
    year: readNumber(row, "year"),
    engine: readString(row, "engine") ?? undefined,
    color: readString(row, "color") ?? undefined,
    fuel: readString(row, "fuel") ?? undefined,
    version: readString(row, "version") ?? undefined,
    source: readString(row, "source") ?? "chat",
    last_seen_at: readString(row, "last_seen_at", "lastSeenAt") ?? "",
  };
}

export function parseCustomerGarage(raw: unknown): CustomerGarage | null {
  const row = asRecord(raw);
  if (!row) return null;
  const vehiclesRaw = row.vehicles;
  const vehicles = Array.isArray(vehiclesRaw)
    ? vehiclesRaw.map(parseVehicle).filter((item): item is CustomerVehicle => Boolean(item))
    : [];

  return {
    first_name: readString(row, "first_name", "firstName"),
    last_name: readString(row, "last_name", "lastName"),
    active_vehicle_key: readString(row, "active_vehicle_key", "activeVehicleKey"),
    vehicles,
    products_consulted: parseProductHistory(row.products_consulted ?? row.productsConsulted),
    products_quoted: parseProductHistory(row.products_quoted ?? row.productsQuoted),
    products_purchased: parseProductHistory(row.products_purchased ?? row.productsPurchased),
  };
}
