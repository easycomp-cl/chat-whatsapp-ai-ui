import type { Metadata } from "next";
import { cookies } from "next/headers";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getWhatsappConnectionAction } from "@/lib/actions/whatsapp-onboarding-actions";
import { WhatsappCallbackClient } from "@/features/whatsapp-onboarding/components/whatsapp-callback-client";
import { PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";
import { FACEBOOK_OAUTH_COOKIE } from "@/lib/meta/embedded-signup";

export const metadata: Metadata = {
  title: `Callback WhatsApp | ${PRODUCT_DISPLAY_NAME}`,
};

type CallbackSearchParams = Promise<{
  code?: string;
  error?: string;
  error_reason?: string;
  error_description?: string;
}>;

type OauthCookiePayload = {
  code?: string | null;
  error?: string | null;
  error_reason?: string | null;
  error_description?: string | null;
};

async function readOauthCookie(): Promise<OauthCookiePayload | null> {
  const store = await cookies();
  const raw = store.get(FACEBOOK_OAUTH_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OauthCookiePayload;
  } catch {
    return null;
  }
}

export default async function WhatsappCallbackPage({
  searchParams,
}: {
  searchParams: CallbackSearchParams;
}) {
  await requireBusinessAdmin();
  const params = await searchParams;
  const oauth = await readOauthCookie();
  const connection = await getWhatsappConnectionAction();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-[#7678ed]">
          Resultado de Meta
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Conexión de WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Esta es la URL de retorno OAuth. Aquí confirmamos el número conectado y
          enviamos el código al backend.
        </p>
      </div>
      <WhatsappCallbackClient
        code={params.code ?? oauth?.code ?? null}
        error={params.error ?? oauth?.error ?? null}
        errorReason={params.error_reason ?? oauth?.error_reason ?? null}
        errorDescription={params.error_description ?? oauth?.error_description ?? null}
        serverConnection={
          connection
            ? {
                connected: connection.connected,
                persisted: connection.persisted,
                backendPending: connection.backendPending,
                status: connection.backendPending
                  ? "authorized_pending_backend"
                  : connection.connected
                    ? "connected"
                    : "idle",
                phoneNumber: connection.phone_number,
                phoneNumberId: connection.phone_number_id,
                wabaId: connection.waba_id,
                metaBusinessId: connection.business_id,
                message: connection.message,
              }
            : null
        }
      />
    </div>
  );
}
