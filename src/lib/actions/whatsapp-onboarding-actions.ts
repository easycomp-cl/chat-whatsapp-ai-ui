"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { botApi, BotApiError, BOT_API_UNAVAILABLE_MESSAGE } from "@/lib/bot-api/client";
import { requireBusinessAdmin, requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { FACEBOOK_OAUTH_COOKIE, getWhatsappCallbackRedirectUri } from "@/lib/meta/embedded-signup";
import type { WhatsappConnection } from "@/lib/bot-api/types";
import type { CompleteEmbeddedSignupInput } from "@/features/whatsapp-onboarding/types";

export type CompleteEmbeddedSignupResult = {
  connected: boolean;
  persisted: boolean;
  backendPending: boolean;
  phone_number?: string | null;
  phone_number_id?: string | null;
  waba_id?: string | null;
  business_id?: string | null;
  status: string;
  message?: string;
};

function normalizeConnection(raw: WhatsappConnection | null | undefined): CompleteEmbeddedSignupResult | null {
  if (!raw) return null;
  const phone = raw.phone_number ?? raw.display_phone_number ?? null;
  const connected = Boolean(raw.connected || phone || raw.phone_number_id);
  if (!connected && !raw.phone_number_id && !raw.waba_id) return null;
  return {
    connected,
    persisted: connected,
    backendPending: false,
    phone_number: phone,
    phone_number_id: raw.phone_number_id ?? null,
    waba_id: raw.waba_id ?? null,
    business_id: raw.business_id ?? null,
    status: connected ? "connected" : String(raw.status ?? "disconnected"),
  };
}

async function getConnectionFromSupabase(businessId: string): Promise<CompleteEmbeddedSignupResult | null> {
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
    backendPending: false,
    phone_number: row.phone_number ?? null,
    phone_number_id: row.phone_number_id ?? null,
    waba_id: row.waba_id ?? null,
    status: row.status ?? "connected",
  };
}

export async function getWhatsappConnectionAction(): Promise<CompleteEmbeddedSignupResult | null> {
  const profile = await requireBusinessAdmin();
  return loadWhatsappConnection(profile.business_id!);
}

export async function getWhatsappConnectionSafeAction(): Promise<CompleteEmbeddedSignupResult | null> {
  const profile = await requireProfile();
  if (profile.role !== "BUSINESS_ADMIN" || !profile.business_id) return null;
  return loadWhatsappConnection(profile.business_id);
}

async function loadWhatsappConnection(businessId: string): Promise<CompleteEmbeddedSignupResult | null> {
  try {
    const connection = await botApi.getWhatsappConnection(businessId);
    const normalized = normalizeConnection(connection);
    if (normalized) return normalized;
  } catch {
    // Endpoint pendiente en backend: caer a Supabase si existe cuenta.
  }

  try {
    return await getConnectionFromSupabase(businessId);
  } catch {
    return null;
  }
}

export async function clearFacebookOauthCookieAction() {
  const store = await cookies();
  store.delete(FACEBOOK_OAUTH_COOKIE);
}

export async function completeWhatsappEmbeddedSignupAction(
  input: CompleteEmbeddedSignupInput
): Promise<CompleteEmbeddedSignupResult> {
  const profile = await requireBusinessAdmin();
  const tenantId = profile.business_id!;
  const code = input.code?.trim();

  if (!code) {
    throw new Error("Meta no devolvió el código de autorización.");
  }

  const body = {
    code,
    waba_id: input.waba_id?.trim() || null,
    phone_number_id: input.phone_number_id?.trim() || null,
    business_id: input.business_id?.trim() || null,
    tenant_id: tenantId,
    redirect_uri: getWhatsappCallbackRedirectUri(),
  };

  try {
    const result = await botApi.completeWhatsappEmbeddedSignup(body);
    revalidatePath("/onboarding/whatsapp");
    revalidatePath("/onboarding/whatsapp/callback");
    revalidatePath("/app/settings");
    revalidatePath("/app/dashboard");
    return {
      connected: result.connected !== false,
      persisted: result.persisted !== false,
      backendPending: false,
      phone_number: result.phone_number ?? result.display_phone_number ?? null,
      phone_number_id: result.phone_number_id ?? body.phone_number_id,
      waba_id: result.waba_id ?? body.waba_id,
      business_id: result.business_id ?? body.business_id,
      status: "connected",
    };
  } catch (error) {
    if (error instanceof BotApiError && (error.status === 404 || error.status === 501)) {
      return {
        connected: true,
        persisted: false,
        backendPending: true,
        phone_number_id: body.phone_number_id,
        waba_id: body.waba_id,
        business_id: body.business_id,
        status: "authorized_pending_backend",
        message:
          "WhatsApp quedó autorizado en Meta, pero el backend aún no implementa POST /whatsapp/embedded-signup/complete.",
      };
    }
    if (error instanceof BotApiError) {
      throw new Error(error.message);
    }
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}
