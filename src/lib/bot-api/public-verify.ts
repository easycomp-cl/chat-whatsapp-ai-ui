import "server-only";

export type PublicPhoneVerification = {
  ok: boolean;
  found: boolean;
  status: "pending" | "expired" | "used" | "invalid";
  business_name: string | null;
  phone_masked: string | null;
};

function getPublicApiBaseUrl(): string {
  const url =
    process.env.BOT_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BOT_API_BASE_URL ||
    "https://api-chatbotmanager.easycomp.cl";
  const normalized = url.replace(/\/$/, "");
  try {
    if (new URL(normalized).hostname === "api.conversai.easycomp.cl") {
      return "https://api-chatbotmanager.easycomp.cl";
    }
  } catch {
    /* keep configured url */
  }
  return normalized;
}

export async function getPublicPhoneVerification(
  token: string
): Promise<PublicPhoneVerification> {
  const safeToken = encodeURIComponent(token.trim());
  const res = await fetch(`${getPublicApiBaseUrl()}/verify-phone/${safeToken}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      ok: false,
      found: false,
      status: "invalid",
      business_name: null,
      phone_masked: null,
    };
  }

  return (await res.json()) as PublicPhoneVerification;
}

export async function confirmPublicPhoneVerification(token: string) {
  const safeToken = encodeURIComponent(token.trim());
  const res = await fetch(`${getPublicApiBaseUrl()}/verify-phone/${safeToken}`, {
    method: "POST",
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    verified_at?: string;
    message?: string;
  };
  if (!res.ok) {
    return {
      ok: false as const,
      error: body.message ?? "No se pudo confirmar el número.",
    };
  }
  return { ok: true as const, verified_at: body.verified_at ?? null };
}
