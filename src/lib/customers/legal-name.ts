import type { Customer } from "@/types/database.types";

function metaString(
  metadata: Record<string, unknown> | null | undefined,
  key: string
): string {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export function customerLegalNames(
  customer: Pick<Customer, "first_name" | "last_name" | "profile_metadata"> | null | undefined
): { first_name: string; last_name: string } {
  if (!customer) return { first_name: "", last_name: "" };
  return {
    first_name: customer.first_name?.trim() || metaString(customer.profile_metadata, "first_name"),
    last_name: customer.last_name?.trim() || metaString(customer.profile_metadata, "last_name"),
  };
}

export function withLegalNameMetadata(
  current: Record<string, unknown> | null | undefined,
  firstName: string,
  lastName: string
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(current ?? {}) };
  if (firstName) next.first_name = firstName;
  else delete next.first_name;
  if (lastName) next.last_name = lastName;
  else delete next.last_name;
  return next;
}
