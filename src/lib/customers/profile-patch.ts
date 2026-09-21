import type { CustomerInvoiceType, CustomerProfilePatch } from "@/lib/bot-api/types";
import { normalizeRutStorage } from "@/lib/customers/rut";

export type CustomerProfileSnapshot = {
  first_name: string;
  last_name: string;
  display_alias: string;
  email: string;
  tax_id: string;
  invoice_type: CustomerInvoiceType;
  company_name: string;
  business_activity: string;
  delivery1_line1: string;
  delivery1_region: string;
  delivery1_commune: string;
  delivery1_notes: string;
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function sameText(left: string, right: string): boolean {
  return text(left) === text(right);
}

function sameRut(left: string, right: string): boolean {
  const a = text(left);
  const b = text(right);
  if (!a && !b) return true;
  return normalizeRutStorage(a) === normalizeRutStorage(b);
}

export function buildChangedCustomerProfilePatch(
  baseline: CustomerProfileSnapshot,
  next: CustomerProfileSnapshot
): CustomerProfilePatch | null {
  const patch: CustomerProfilePatch = {};

  if (!sameText(baseline.first_name, next.first_name)) {
    patch.first_name = text(next.first_name) || null;
  }
  if (!sameText(baseline.last_name, next.last_name)) {
    patch.last_name = text(next.last_name) || null;
  }
  if (!sameText(baseline.display_alias, next.display_alias)) {
    patch.display_alias = text(next.display_alias) || null;
  }
  if (!sameText(baseline.email, next.email)) {
    patch.email = text(next.email) || null;
  }
  if (!sameRut(baseline.tax_id, next.tax_id)) {
    patch.tax_id = text(next.tax_id) || null;
  }
  if (baseline.invoice_type !== next.invoice_type) {
    patch.invoice_type = next.invoice_type === "NONE" ? null : next.invoice_type;
  }
  if (!sameText(baseline.company_name, next.company_name)) {
    patch.company_name = text(next.company_name) || null;
  }
  if (!sameText(baseline.business_activity, next.business_activity)) {
    patch.business_activity = text(next.business_activity) || null;
  }
  if (!sameText(baseline.delivery1_line1, next.delivery1_line1)) {
    patch.delivery1_line1 = text(next.delivery1_line1) || null;
  }
  if (!sameText(baseline.delivery1_region, next.delivery1_region)) {
    patch.delivery1_region = text(next.delivery1_region) || null;
  }
  if (!sameText(baseline.delivery1_commune, next.delivery1_commune)) {
    patch.delivery1_commune = text(next.delivery1_commune) || null;
  }
  if (!sameText(baseline.delivery1_notes, next.delivery1_notes)) {
    patch.delivery1_notes = text(next.delivery1_notes) || null;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

const PROFILE_CHANGE_LABELS: Record<string, string> = {
  first_name: "nombre",
  last_name: "apellido",
  display_alias: "nombre visible",
  email: "email",
  tax_id: "RUT",
  invoice_type: "tipo de documento",
  company_name: "razón social",
  business_activity: "giro",
  delivery1_line1: "dirección",
  delivery1_region: "región",
  delivery1_commune: "comuna",
  delivery1_notes: "notas de entrega",
  manual_returning: "cliente frecuente",
};

const INVOICE_CHANGE_LABELS: Record<string, string> = {
  RECEIPT: "boleta",
  INVOICE: "factura",
  NONE: "sin definir",
};

function patchValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" ? value.trim() : "";
}

function humanizeInvoiceToken(raw: string): string {
  const code = raw.trim().toUpperCase();
  return INVOICE_CHANGE_LABELS[code] ?? raw.trim();
}

function displayFieldValue(key: string, value: unknown): string {
  const raw = patchValue(value);
  if (key === "invoice_type") {
    return humanizeInvoiceToken(raw) || "vacío";
  }
  if (key === "manual_returning") {
    const lower = raw.toLowerCase();
    if (lower === "true" || lower === "1" || lower === "sí" || lower === "si") return "sí";
    if (lower === "false" || lower === "0" || lower === "no") return "no";
  }
  // Por si el backend mandó el enum suelto sin key tipada.
  if (/^(RECEIPT|INVOICE|NONE)$/i.test(raw)) {
    return humanizeInvoiceToken(raw);
  }
  return raw || "vacío";
}

function baselineFieldValue(baseline: CustomerProfileSnapshot, key: string): string {
  if (key === "invoice_type") {
    return INVOICE_CHANGE_LABELS[baseline.invoice_type] ?? "vacío";
  }
  const current = baseline[key as keyof CustomerProfileSnapshot];
  return typeof current === "string" && current.trim() ? current.trim() : "vacío";
}

function formatAddedLine(key: string, value: unknown): string {
  return `${PROFILE_CHANGE_LABELS[key] ?? key}: ${displayFieldValue(key, value)}`;
}

function formatModifiedLine(key: string, previous: string, value: unknown): string {
  return `${PROFILE_CHANGE_LABELS[key] ?? key}: ${previous} -> ${displayFieldValue(key, value)}`;
}

function baselineIsEmpty(baseline: CustomerProfileSnapshot, key: string): boolean {
  if (key === "invoice_type") return baseline.invoice_type === "NONE";
  const current = baseline[key as keyof CustomerProfileSnapshot];
  return typeof current !== "string" || !current.trim();
}

export type ProfileChangeGroups = {
  added: string[];
  modified: string[];
};

export function groupProfileChanges(
  baseline: CustomerProfileSnapshot,
  patch: CustomerProfilePatch
): ProfileChangeGroups {
  const added: string[] = [];
  const modified: string[] = [];

  for (const [key, value] of Object.entries(patch)) {
    if (!(key in PROFILE_CHANGE_LABELS)) continue;
    const nextText = patchValue(value);
    if (baselineIsEmpty(baseline, key) && nextText) {
      added.push(formatAddedLine(key, value));
    } else {
      modified.push(formatModifiedLine(key, baselineFieldValue(baseline, key), value));
    }
  }

  return { added, modified };
}

export function describeAdvisorProfileChange(groups: ProfileChangeGroups): string {
  const parts: string[] = [];
  if (groups.added.length > 0) parts.push(`se añadió: ${groups.added.join(", ")}`);
  if (groups.modified.length > 0) parts.push(`se modificó: ${groups.modified.join(", ")}`);
  return parts.join(". ") || "El asesor guardó un dato del contacto";
}

function resolveChangeFieldKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (PROFILE_CHANGE_LABELS[trimmed]) return trimmed;
  const matched = Object.entries(PROFILE_CHANGE_LABELS).find(
    ([, label]) => label.toLowerCase() === trimmed.toLowerCase()
  );
  return matched?.[0] ?? trimmed;
}

/** Normaliza líneas crudas del backend (`manual_returning: true`) a texto legible. */
export function humanizeProfileChangeLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return trimmed;

  const colonIdx = trimmed.indexOf(":");
  if (colonIdx <= 0) return trimmed;

  const rawKey = trimmed.slice(0, colonIdx).trim();
  const rest = trimmed.slice(colonIdx + 1).trim();
  const key = resolveChangeFieldKey(rawKey);
  const label = PROFILE_CHANGE_LABELS[key] ?? rawKey;

  const arrowParts = rest.split(/\s*->\s*/);
  if (arrowParts.length === 2) {
    return `${label}: ${displayFieldValue(key, arrowParts[0])} -> ${displayFieldValue(key, arrowParts[1])}`;
  }

  return `${label}: ${displayFieldValue(key, rest)}`;
}
