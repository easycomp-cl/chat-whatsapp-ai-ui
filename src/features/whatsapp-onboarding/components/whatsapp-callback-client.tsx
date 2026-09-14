"use client";

import { useEffect } from "react";
import { ConnectWhatsappPanel } from "./connect-whatsapp-panel";
import { clearFacebookOauthCookieAction } from "@/lib/actions/whatsapp-onboarding-actions";
import type { FacebookOauthPayload, WhatsappConnectionView } from "../types";

type WhatsappCallbackClientProps = {
  oauth: FacebookOauthPayload | null;
  serverConnection: WhatsappConnectionView | null;
};

export function WhatsappCallbackClient({
  oauth,
  serverConnection,
}: WhatsappCallbackClientProps) {
  useEffect(() => {
    void clearFacebookOauthCookieAction().catch(() => undefined);
  }, []);

  return (
    <ConnectWhatsappPanel
      initialConnection={serverConnection}
      autoComplete={
        oauth?.code || oauth?.error
          ? {
              code: oauth.code ?? null,
              error: oauth.error ?? null,
              errorReason: oauth.error_reason ?? null,
              errorDescription: oauth.error_description ?? null,
              redirectUri: oauth.redirect_uri ?? null,
            }
          : undefined
      }
    />
  );
}
