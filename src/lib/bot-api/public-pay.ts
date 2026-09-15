import "server-only";

export type PublicPaymentLink = {
  ok: boolean;
  found: boolean;
  code: string;
  order_ref: string;
  business_name: string | null;
  destination_url: string | null;
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

export async function getPublicPaymentLink(code: string): Promise<PublicPaymentLink> {
  const safeCode = encodeURIComponent(code.trim());
  const res = await fetch(`${getPublicApiBaseUrl()}/pay/${safeCode}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      ok: false,
      found: false,
      code,
      order_ref: code,
      business_name: null,
      destination_url: null,
    };
  }

  return (await res.json()) as PublicPaymentLink;
}
