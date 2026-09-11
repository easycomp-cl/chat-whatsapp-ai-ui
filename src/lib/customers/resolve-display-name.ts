import type { Customer } from "@/types/database.types";

export function resolveCustomerDisplayName(
  customer: Pick<Customer, "display_alias" | "name" | "phone_number"> | null | undefined
): string {
  if (!customer) return "Sin nombre";
  const alias = customer.display_alias?.trim();
  if (alias) return alias;
  const whatsappName = customer.name?.trim();
  if (whatsappName) return whatsappName;
  if (customer.phone_number?.trim()) return customer.phone_number;
  return "Sin nombre";
}
