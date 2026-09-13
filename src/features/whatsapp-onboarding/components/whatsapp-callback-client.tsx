"use client";

import { useEffect, useMemo } from "react";
import { ConnectWhatsappPanel } from "./connect-whatsapp-panel";
import { readWhatsappSignupSnapshot } from "../session-store";
import { clearFacebookOauthCookieAction } from "@/lib/actions/whatsapp-onboarding-actions";
import type { WhatsappConnectionView } from "../types";

type WhatsappCallbackClientProps = {
  code: string | null;
  error: string | null;
  errorReason: string | null;
  errorDescription: string | null;
  serverConnection: WhatsappConnectionView | null;
};

export function WhatsappCallbackClient({
  code,
  error,
  errorReason,
  errorDescription,
  serverConnection,
}: WhatsappCallbackClientProps) {
  const snapshot = useMemo(() => readWhatsappSignupSnapshot(), []);
  const initialConnection = serverConnection ?? snapshot;

  useEffect(() => {
    void clearFacebookOauthCookieAction();
  }, []);

  return (
    <ConnectWhatsappPanel
      initialConnection={initialConnection}
      autoComplete={{
        code,
        error,
        errorReason,
        errorDescription,
      }}
    />
  );
}
