"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { botApi, getBotApiErrorMessage } from "@/lib/bot-api/client";
import { requireBusinessAdmin } from "@/lib/auth/session";
import {
  FACEBOOK_OAUTH_COOKIE,
  sanitizeEmbeddedSignupRedirectUri,
} from "@/lib/meta/embedded-signup";
import { loadWhatsappConnection } from "@/lib/whatsapp/connection";
import type { CompleteEmbeddedSignupInput } from "@/features/whatsapp-onboarding/types";
import type { EmbeddedSignupCompleteBody } from "@/lib/bot-api/types";
import type { WhatsappConnectionRecord } from "@/lib/whatsapp/types";

export type CompleteEmbeddedSignupResult = WhatsappConnectionRecord;

export type CompleteEmbeddedSignupActionResult =
  | { ok: true; connection: WhatsappConnectionRecord }
  | { ok: false; error: string; connection: null };

function optionalId(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function completeFailureMessage(error: unknown): string {
  const message =
    typeof error === "string"
      ? error.trim()
      : getBotApiErrorMessage(error).trim();
  const base = message || "No se pudo guardar la conexión de WhatsApp.";
  if (/vuelve a abrir/i.test(base)) return base;
  return `${base} Vuelve a abrir la ventana de Meta para conectar.`;
}

function revalidateWhatsappPaths() {
  after(() => {
    revalidatePath("/onboarding/whatsapp");
    revalidatePath("/onboarding/whatsapp/callback");
    revalidatePath("/app/settings");
    revalidatePath("/app/dashboard");
  });
}

export async function clearFacebookOauthCookieAction() {
  const store = await cookies();
  store.delete(FACEBOOK_OAUTH_COOKIE);
}

export async function getWhatsappConnectionAction(): Promise<WhatsappConnectionRecord | null> {
  try {
    const profile = await requireBusinessAdmin();
    return await loadWhatsappConnection(profile.business_id!);
  } catch {
    return null;
  }
}

export async function completeWhatsappEmbeddedSignupAction(
  input: CompleteEmbeddedSignupInput
): Promise<CompleteEmbeddedSignupActionResult> {
  const profile = await requireBusinessAdmin();
  const tenantId = profile.business_id!;
  const code = input.code?.trim();

  if (!code) {
    return {
      ok: false,
      error: "Meta no devolvió el código de autorización. Vuelve a abrir la ventana de Meta para conectar.",
      connection: null,
    };
  }

  const wabaId = optionalId(input.waba_id);
  const phoneNumberId = optionalId(input.phone_number_id);
  const businessId = optionalId(input.business_id);
  const redirectUri = sanitizeEmbeddedSignupRedirectUri(input.redirect_uri);

  const body: EmbeddedSignupCompleteBody = {
    code,
    tenant_id: tenantId,
  };
  if (wabaId) body.waba_id = wabaId;
  if (phoneNumberId) body.phone_number_id = phoneNumberId;
  if (businessId) body.business_id = businessId;
  if (redirectUri) body.redirect_uri = redirectUri;

  try {
    const result = await botApi.completeWhatsappEmbeddedSignup(body);
    if (result?.connected === false) {
      return {
        ok: false,
        error: completeFailureMessage(
          result.message ?? "El servidor no confirmó la conexión de WhatsApp."
        ),
        connection: null,
      };
    }

    const connection: WhatsappConnectionRecord = {
      connected: true,
      persisted: result?.persisted !== false,
      phone_number: result?.display_phone_number ?? result?.phone_number ?? null,
      phone_number_id: result?.phone_number_id ?? phoneNumberId ?? null,
      waba_id: result?.waba_id ?? wabaId ?? null,
      business_id: result?.business_id ?? businessId ?? null,
      status: "connected",
    };
    revalidateWhatsappPaths();
    return { ok: true, connection };
  } catch (error) {
    return {
      ok: false,
      error: completeFailureMessage(error),
      connection: null,
    };
  }
}
