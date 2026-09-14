import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { loadWhatsappConnection } from "@/lib/whatsapp/connection";
import { WhatsappCallbackClient } from "@/features/whatsapp-onboarding/components/whatsapp-callback-client";
import { toWhatsappConnectionView } from "@/features/whatsapp-onboarding/map-connection";
import { PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";
import { FACEBOOK_OAUTH_COOKIE } from "@/lib/meta/embedded-signup";
import type { FacebookOauthPayload } from "@/features/whatsapp-onboarding/types";
import type { WhatsappConnectionRecord } from "@/lib/whatsapp/types";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Callback WhatsApp | ${PRODUCT_DISPLAY_NAME}`,
};

async function readOauthCookie(): Promise<FacebookOauthPayload | null> {
  try {
    const store = await cookies();
    const raw = store.get(FACEBOOK_OAUTH_COOKIE)?.value;
    if (!raw) return null;
    return JSON.parse(raw) as FacebookOauthPayload;
  } catch {
    return null;
  }
}

async function loadConnectionSafe(businessId: string): Promise<WhatsappConnectionRecord | null> {
  try {
    return await loadWhatsappConnection(businessId);
  } catch {
    return null;
  }
}

export default async function WhatsappCallbackPage() {
  const profile = await requireBusinessAdmin();
  const [connection, oauth] = await Promise.all([
    loadConnectionSafe(profile.business_id!),
    readOauthCookie(),
  ]);

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
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <WhatsappCallbackClient
          oauth={oauth}
          serverConnection={toWhatsappConnectionView(connection)}
        />
      </Suspense>
    </div>
  );
}
