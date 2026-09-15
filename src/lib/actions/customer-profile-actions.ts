"use server";

import { revalidatePath } from "next/cache";
import { botApi, BotApiError } from "@/lib/bot-api/client";
import type { CustomerProfilePatch } from "@/lib/bot-api/types";
import { requireAppAccess, requireBusinessAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  formatRutDisplay,
  isValidChileanRut,
  normalizeRutStorage,
} from "@/lib/customers/rut";

export async function getCustomerProfileAction(customerId: string) {
  const profile = await requireAppAccess();
  if (!profile.business_id) {
    return { ok: false as const, reason: "no_business" as const };
  }

  try {
    const customer = await botApi.getCustomer(profile.business_id, customerId);
    return { ok: true as const, customer };
  } catch (error) {
    if (error instanceof BotApiError && (error.status === 404 || error.status === 501)) {
      return { ok: false as const, reason: "api_not_ready" as const };
    }
    throw error;
  }
}

export async function updateCustomerProfileAction(
  conversationId: string,
  customerId: string,
  patch: CustomerProfilePatch
) {
  await requireBusinessAdmin();
  const profile = await requireAppAccess();
  if (!profile.business_id) {
    throw new Error("Negocio no configurado");
  }

  const body: CustomerProfilePatch = { ...patch };

  if (body.tax_id !== undefined) {
    const trimmed = body.tax_id?.trim() ?? "";
    if (!trimmed) {
      body.tax_id = null;
    } else {
      if (!isValidChileanRut(trimmed)) {
        throw new Error("RUT inválido. Revisa el número y el dígito verificador.");
      }
      body.tax_id = formatRutDisplay(normalizeRutStorage(trimmed));
    }
  }

  if (body.display_alias !== undefined) {
    body.display_alias = body.display_alias?.trim() || null;
  }

  if (body.email !== undefined) {
    body.email = body.email?.trim() || null;
  }

  if (body.company_name !== undefined) {
    body.company_name = body.company_name?.trim() || null;
  }

  if (body.business_activity !== undefined) {
    body.business_activity = body.business_activity?.trim() || null;
  }

  if (body.delivery1_line1 !== undefined) {
    body.delivery1_line1 = body.delivery1_line1?.trim() || null;
  }

  if (body.delivery1_notes !== undefined) {
    body.delivery1_notes = body.delivery1_notes?.trim() || null;
  }

  try {
    const customer = await botApi.patchCustomer(
      profile.business_id,
      customerId,
      body
    );
    revalidatePath("/app/conversations");
    revalidatePath(`/app/conversations/${conversationId}`);
    return { ok: true as const, customer };
  } catch (error) {
    if (error instanceof BotApiError && (error.status === 404 || error.status === 501)) {
      throw new Error(
        "El guardado de datos del cliente aún no está disponible en el servidor. El equipo backend debe desplegar el perfil de contacto."
      );
    }
    throw error;
  }
}

export async function setCustomerFrequentAction(
  conversationId: string,
  customerId: string,
  frequent: boolean
) {
  await requireBusinessAdmin();
  const profile = await requireAppAccess();
  if (!profile.business_id) {
    throw new Error("Negocio no configurado");
  }

  try {
    const customer = await botApi.patchCustomer(profile.business_id, customerId, {
      profile_metadata: { manual_returning: frequent },
    });
    revalidatePath("/app/conversations");
    revalidatePath(`/app/conversations/${conversationId}`);
    revalidatePath("/app/customers");
    return { ok: true as const, persisted: true as const, customer };
  } catch (error) {
    if (error instanceof BotApiError && (error.status === 404 || error.status === 501)) {
      return { ok: true as const, persisted: false as const, customer: null };
    }
    throw error;
  }
}

export type CustomerListItem = {
  id: string;
  business_id: string;
  phone_number: string;
  name: string | null;
  display_alias?: string | null;
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  profile_metadata?: Record<string, unknown> | null;
  conversation_id: string | null;
};

export async function listBusinessCustomersAction(): Promise<CustomerListItem[]> {
  const profile = await requireAppAccess();
  const businessId = profile.business_id;
  if (!businessId) return [];

  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .order("last_seen_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[clientes] Error cargando customers:", error);
    return [];
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, customer_id, last_message_at")
    .eq("business_id", businessId)
    .order("last_message_at", { ascending: false });

  const conversationByCustomer = new Map<string, string>();
  for (const row of conversations ?? []) {
    if (!conversationByCustomer.has(row.customer_id)) {
      conversationByCustomer.set(row.customer_id, row.id);
    }
  }

  return ((customers ?? []) as CustomerListItem[]).map((customer) => ({
    ...customer,
    conversation_id: conversationByCustomer.get(customer.id) ?? null,
  }));
}
