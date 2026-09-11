import { STORAGE_PREFIX } from "@/lib/brand/constants";

export const CLIENTS_MODULE = {
  navLabel: "Mis Clientes",
  pageTitle: "Mis Clientes",
  pageDescription: "Contactos de tu negocio agrupados por frecuencia de atención",
  tabFrequent: "Clientes frecuentes",
  tabOthers: "Otros clientes",
} as const;

export const FREQUENT_CUSTOMER_STORAGE_KEY = `${STORAGE_PREFIX}:frequent-customers`;
const FREQUENT_CUSTOMER_OVERRIDES_KEY = `${STORAGE_PREFIX}:frequent-customer-overrides`;

type FrequentOverrides = Record<string, boolean>;

export function getFrequentCustomerStorageKey(businessId: string) {
  return `${FREQUENT_CUSTOMER_STORAGE_KEY}:${businessId}`;
}

function getFrequentCustomerOverridesKey(businessId: string) {
  return `${FREQUENT_CUSTOMER_OVERRIDES_KEY}:${businessId}`;
}

function readLegacyFrequentCustomerIds(businessId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(getFrequentCustomerStorageKey(businessId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function readFrequentCustomerOverrides(businessId: string): FrequentOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getFrequentCustomerOverridesKey(businessId));
    if (raw) {
      const parsed = JSON.parse(raw) as FrequentOverrides;
      if (parsed && typeof parsed === "object") return parsed;
    }

    const legacyIds = readLegacyFrequentCustomerIds(businessId);
    if (legacyIds.size === 0) return {};

    const migrated = Object.fromEntries([...legacyIds].map((id) => [id, true]));
    writeFrequentCustomerOverrides(businessId, migrated);
    return migrated;
  } catch {
    return {};
  }
}

export function writeFrequentCustomerOverrides(
  businessId: string,
  overrides: FrequentOverrides
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getFrequentCustomerOverridesKey(businessId),
    JSON.stringify(overrides)
  );
}

/** @deprecated Usar readFrequentCustomerOverrides */
export function readFrequentCustomerIds(businessId: string): Set<string> {
  const overrides = readFrequentCustomerOverrides(businessId);
  return new Set(
    Object.entries(overrides)
      .filter(([, frequent]) => frequent)
      .map(([id]) => id)
  );
}

export function setCustomerFrequentLocally(
  businessId: string,
  customerId: string,
  frequent: boolean
) {
  const overrides = readFrequentCustomerOverrides(businessId);
  overrides[customerId] = frequent;
  writeFrequentCustomerOverrides(businessId, overrides);
}

export function isCustomerFrequent(
  customer: { id: string; profile_metadata?: Record<string, unknown> | null } | null | undefined,
  businessId: string
): boolean {
  if (!customer) return false;

  const overrides = readFrequentCustomerOverrides(businessId);
  if (customer.id in overrides) {
    return overrides[customer.id] === true;
  }

  return customer.profile_metadata?.manual_returning === true;
}
