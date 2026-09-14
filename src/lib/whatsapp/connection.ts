import "server-only";

import { botApi, BotApiError } from "@/lib/bot-api/client";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { WhatsappConnection } from "@/lib/bot-api/types";
import type { WhatsappConnectionRecord } from "@/lib/whatsapp/types";

export type { WhatsappConnectionRecord };

function normalizeConnection(
  raw: WhatsappConnection | null | undefined
): WhatsappConnectionRecord | null {
  if (!raw || raw.connected !== true) return null;
  const phone = raw.display_phone_number ?? raw.phone_number ?? null;
  return {
    connected: true,
    persisted: true,
    phone_number: phone,
    phone_number_id: raw.phone_number_id ?? null,
    waba_id: raw.waba_id ?? null,
    business_id: raw.business_id ?? null,
    status: "connected",
  };
}

async function getConnectionFromSupabase(
  businessId: string
): Promise<WhatsappConnectionRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("whatsapp_accounts")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const row = data as {
    phone_number?: string | null;
    phone_number_id?: string | null;
    waba_id?: string | null;
    status?: string | null;
    is_active?: boolean | null;
  };

  if (row.is_active === false) return null;

  return {
    connected: true,
    persisted: true,
    phone_number: row.phone_number ?? null,
    phone_number_id: row.phone_number_id ?? null,
    waba_id: row.waba_id ?? null,
    status: row.status ?? "connected",
  };
}

export async function loadWhatsappConnection(
  businessId: string
): Promise<WhatsappConnectionRecord | null> {
  try {
    const connection = await botApi.getWhatsappConnection(businessId);
    if (!connection || connection.connected === false) {
      return null;
    }
    return normalizeConnection(connection);
  } catch (error) {
    if (error instanceof BotApiError && (error.status === 404 || error.status === 501)) {
      return null;
    }
  }

  try {
    return await getConnectionFromSupabase(businessId);
  } catch {
    return null;
  }
}

export async function loadWhatsappConnectionSafe(): Promise<WhatsappConnectionRecord | null> {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== "BUSINESS_ADMIN" || !profile.business_id) {
      return null;
    }
    return await loadWhatsappConnection(profile.business_id);
  } catch {
    return null;
  }
}
