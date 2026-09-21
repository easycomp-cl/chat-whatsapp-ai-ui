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
import { formatProfileDisplayName } from "@/lib/profile/display-name";
import type { GarageProductBucket } from "@/lib/customers/vehicle";
import type { CustomerGarage } from "@/types/message";

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

  if (body.first_name !== undefined) {
    body.first_name = body.first_name?.trim() || null;
  }

  if (body.last_name !== undefined) {
    body.last_name = body.last_name?.trim() || null;
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

  const nameMetadata: Record<string, unknown> = {};
  if (body.first_name !== undefined) nameMetadata.first_name = body.first_name;
  if (body.last_name !== undefined) nameMetadata.last_name = body.last_name;
  delete body.first_name;
  delete body.last_name;
  delete body.profile_metadata;

  try {
    const actorName = formatProfileDisplayName(profile);
    const customer = await botApi.patchCustomer(
      profile.business_id,
      customerId,
      {
        ...body,
        ...(Object.keys(nameMetadata).length > 0 ? { profile_metadata: nameMetadata } : {}),
        conversation_id: conversationId,
        profile_updated_by: "BUSINESS_ADMIN",
        actor_name: actorName,
      }
    );
    revalidatePath("/app/conversations");
    revalidatePath(`/app/conversations/${conversationId}`);
    return {
      ok: true as const,
      customer,
      actorName,
    };
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
  frequent: boolean,
  _currentMetadata?: Record<string, unknown> | null
) {
  await requireBusinessAdmin();
  const profile = await requireAppAccess();
  if (!profile.business_id) {
    throw new Error("Negocio no configurado");
  }

  const actorName = formatProfileDisplayName(profile);

  try {
    const customer = await botApi.patchCustomer(profile.business_id, customerId, {
      profile_metadata: { manual_returning: frequent },
      conversation_id: conversationId,
      profile_updated_by: "BUSINESS_ADMIN",
      actor_name: actorName,
    });
    revalidatePath("/app/conversations");
    revalidatePath(`/app/conversations/${conversationId}`);
    revalidatePath("/app/customers");
    return { ok: true as const, persisted: true as const, customer, actorName };
  } catch (error) {
    if (error instanceof BotApiError && (error.status === 404 || error.status === 501)) {
      return { ok: true as const, persisted: false as const, customer: null, actorName };
    }
    throw error;
  }
}

export async function removeCustomerGarageVehicleAction(
  conversationId: string,
  customerId: string,
  vehicleKey: string
) {
  await requireBusinessAdmin();
  const profile = await requireAppAccess();
  if (!profile.business_id) throw new Error("Negocio no configurado");

  const actorName = formatProfileDisplayName(profile);

  try {
    const customer = await botApi.deleteCustomerVehicle(
      profile.business_id,
      customerId,
      vehicleKey,
      {
        conversation_id: conversationId,
        actor_name: actorName,
      }
    );
    revalidatePath("/app/conversations");
    revalidatePath(`/app/conversations/${conversationId}`);
    revalidatePath("/app/customers");
    return {
      ok: true as const,
      customer,
      garage: (customer.garage ?? null) as CustomerGarage | null,
      actorName,
    };
  } catch (error) {
    if (error instanceof BotApiError && error.status === 404) {
      throw new Error("Ese vehículo ya no está en el garage del contacto.");
    }
    if (error instanceof BotApiError && error.status === 501) {
      throw new Error(
        "No se pudo eliminar el vehículo. El backend debe exponer DELETE .../vehicles/:vehicleKey."
      );
    }
    throw error;
  }
}

export async function removeCustomerGarageProductAction(
  conversationId: string,
  customerId: string,
  bucket: GarageProductBucket,
  identity: string
) {
  await requireBusinessAdmin();
  const profile = await requireAppAccess();
  if (!profile.business_id) throw new Error("Negocio no configurado");

  const actorName = formatProfileDisplayName(profile);

  try {
    const customer = await botApi.deleteCustomerProduct(profile.business_id, customerId, {
      conversation_id: conversationId,
      actor_name: actorName,
      bucket,
      identity,
    });
    revalidatePath("/app/conversations");
    revalidatePath(`/app/conversations/${conversationId}`);
    revalidatePath("/app/customers");
    return {
      ok: true as const,
      customer,
      garage: (customer.garage ?? null) as CustomerGarage | null,
      actorName,
    };
  } catch (error) {
    if (error instanceof BotApiError && error.status === 404) {
      throw new Error("Ese producto ya no está en el historial del contacto.");
    }
    if (error instanceof BotApiError && error.status === 501) {
      throw new Error(
        "No se pudo eliminar el producto. El backend debe exponer DELETE .../products."
      );
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
