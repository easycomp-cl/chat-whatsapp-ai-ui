"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Script from "next/script";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Smartphone, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { completeWhatsappEmbeddedSignupAction } from "@/lib/actions/whatsapp-onboarding-actions";
import {
  FACEBOOK_OAUTH_CALLBACK_PATH,
  WHATSAPP_CALLBACK_PATH,
  WHATSAPP_ONBOARDING_PATH,
} from "@/lib/meta/embedded-signup";
import { mapEmbeddedSignupError } from "../errors";
import {
  clearWhatsappSignupSnapshot,
  readWhatsappSignupSnapshot,
  saveWhatsappSignupSnapshot,
} from "../session-store";
import { toWhatsappConnectionView } from "../map-connection";
import { useFacebookEmbeddedSignup } from "../use-facebook-embedded-signup";
import type { CompleteEmbeddedSignupInput, WhatsappConnectUiStatus, WhatsappConnectionView } from "../types";

function isRedactedServerError(message: string) {
  return (
    message.includes("Server Components render") ||
    message.includes("omitted in production")
  );
}

function clientActionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (isRedactedServerError(message)) {
    return mapEmbeddedSignupError({ kind: "unknown" });
  }
  return message.trim() || mapEmbeddedSignupError({ kind: "unknown" });
}

function optionalId(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="font-mono text-sm break-all">{value?.trim() ? value : "—"}</span>
    </div>
  );
}

type ConnectWhatsappPanelProps = {
  initialConnection?: WhatsappConnectionView | null;
  autoComplete?: {
    code?: string | null;
    error?: string | null;
    errorReason?: string | null;
    errorDescription?: string | null;
    redirectUri?: string | null;
  };
};

export function ConnectWhatsappPanel({
  initialConnection,
  autoComplete,
}: ConnectWhatsappPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { sdkReady, sdkError, launch, initSdk } = useFacebookEmbeddedSignup();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<WhatsappConnectUiStatus>(
    initialConnection?.connected ? "connected" : "idle"
  );
  const [view, setView] = useState<WhatsappConnectionView | null>(
    initialConnection?.connected ? initialConnection : null
  );
  const [error, setError] = useState<string | null>(null);
  const [autoRan, setAutoRan] = useState(false);

  const busy = pending || status === "connecting" || status === "completing" || status === "sdk_loading";

  const persistCapture = useCallback(
    (capture: {
      code?: string | null;
      waba_id?: string | null;
      phone_number_id?: string | null;
      business_id?: string | null;
      redirect_uri?: string | null;
    }) => {
      const code = capture.code?.trim();
      if (!code) {
        throw new Error(mapEmbeddedSignupError({ kind: "missing_code" }));
      }

      const wabaId = optionalId(capture.waba_id);
      const phoneNumberId = optionalId(capture.phone_number_id);
      const businessId = optionalId(capture.business_id);
      const redirectUri = optionalId(capture.redirect_uri);

      if (!redirectUri && (!wabaId || !phoneNumberId)) {
        throw new Error(mapEmbeddedSignupError({ kind: "missing_session" }));
      }

      setStatus("completing");
      setError(null);

      startTransition(async () => {
        try {
          const input: CompleteEmbeddedSignupInput = { code };
          if (wabaId) input.waba_id = wabaId;
          if (phoneNumberId) input.phone_number_id = phoneNumberId;
          if (businessId) input.business_id = businessId;
          if (redirectUri) input.redirect_uri = redirectUri;

          const result = await completeWhatsappEmbeddedSignupAction(input);
          if (!result.ok) {
            clearWhatsappSignupSnapshot();
            setView(null);
            setStatus("error");
            setError(result.error);
            toast.error("No se pudo completar la conexión", { description: result.error });
            return;
          }

          const next = toWhatsappConnectionView(result.connection);
          if (!next) {
            clearWhatsappSignupSnapshot();
            setView(null);
            setStatus("error");
            const message =
              "El servidor no confirmó la conexión. Vuelve a abrir la ventana de Meta para conectar.";
            setError(message);
            toast.error("No se pudo completar la conexión", { description: message });
            return;
          }

          setView(next);
          saveWhatsappSignupSnapshot(next);
          setStatus("connected");
          toast.success("WhatsApp conectado");
        } catch (err) {
          const message = clientActionErrorMessage(err);
          clearWhatsappSignupSnapshot();
          setView(null);
          setStatus("error");
          setError(message);
          toast.error("No se pudo completar la conexión", { description: message });
        }
      });
    },
    []
  );

  useEffect(() => {
    if (initialConnection?.connected) {
      setView(initialConnection);
      setStatus("connected");
      saveWhatsappSignupSnapshot(initialConnection);
      return;
    }

    setView((current) => {
      if (current?.connected && current.persisted) return current;
      const snap = readWhatsappSignupSnapshot();
      if (snap?.connected && snap.persisted && snap.status === "connected") {
        return snap;
      }
      return current?.connected ? current : null;
    });
  }, [initialConnection]);

  useEffect(() => {
    if (autoRan) return;

    const urlError = searchParams.get("error") ?? autoComplete?.error ?? null;
    const urlCode = searchParams.get("code") ?? autoComplete?.code ?? null;
    const urlErrorReason =
      searchParams.get("error_reason") ?? autoComplete?.errorReason ?? null;
    const urlErrorDescription =
      searchParams.get("error_description") ?? autoComplete?.errorDescription ?? null;

    if (urlError) {
      setAutoRan(true);
      const message = mapEmbeddedSignupError({
        facebookError: urlError,
        facebookReason: urlErrorReason,
        facebookDescription: urlErrorDescription,
      });
      setStatus(urlError === "access_denied" ? "cancelled" : "error");
      setError(message);
      return;
    }

    if (!urlCode) return;

    const snap = readWhatsappSignupSnapshot();
    if (snap?.persisted && snap.connected) {
      setAutoRan(true);
      return;
    }

    const queryCode = searchParams.get("code");
    const canSendRedirectUri =
      pathname === WHATSAPP_CALLBACK_PATH ||
      pathname === FACEBOOK_OAUTH_CALLBACK_PATH ||
      pathname === WHATSAPP_ONBOARDING_PATH;
    const redirectUri =
      optionalId(autoComplete?.redirectUri) ??
      (queryCode && canSendRedirectUri
        ? `${window.location.origin}${pathname}`
        : undefined);

    setAutoRan(true);
    persistCapture({
      code: urlCode,
      waba_id: snap?.wabaId ?? view?.wabaId,
      phone_number_id: snap?.phoneNumberId ?? view?.phoneNumberId,
      business_id: snap?.metaBusinessId ?? view?.metaBusinessId,
      redirect_uri: redirectUri,
    });
    if (searchParams.toString()) {
      router.replace(pathname);
    }
  }, [autoComplete, autoRan, pathname, persistCapture, router, searchParams, view]);

  function handleConnect() {
    setError(null);
    setStatus("connecting");
    launch()
      .then((capture) => {
        try {
          persistCapture({
            code: capture.code,
            waba_id: capture.waba_id,
            phone_number_id: capture.phone_number_id,
            business_id: capture.business_id,
          });
        } catch (err: unknown) {
          const message = clientActionErrorMessage(err);
          setStatus("error");
          setError(message);
        }
      })
      .catch((err: unknown) => {
        const message = clientActionErrorMessage(err);
        const cancelled = message.toLowerCase().includes("cancelaste");
        setStatus(cancelled ? "cancelled" : "error");
        setError(message);
      });
  }

  const statusBadge = useMemo(() => {
    if (status === "connected") {
      return <Badge className="bg-emerald-600 text-white">Conectado</Badge>;
    }
    if (status === "connecting" || status === "completing") {
      return <Badge variant="secondary">Conectando…</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="outline">Cancelado</Badge>;
    }
    if (status === "error") {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="outline">Sin conectar</Badge>;
  }, [status]);

  const showSuccess = status === "connected" && view?.connected;

  return (
    <>
      <div id="fb-root" />
      <Script
        id="facebook-jssdk"
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        onReady={() => {
          initSdk();
        }}
      />

      <Card className="w-full">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl">Conectar WhatsApp Business</CardTitle>
              <CardDescription>
                Autoriza tu número de WhatsApp Business con Meta para que el bot pueda
                enviar y recibir mensajes.
              </CardDescription>
            </div>
            {statusBadge}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {showSuccess ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">Número conectado</p>
                  <p className="text-sm text-emerald-800/80">
                    {view.phoneNumber
                      ? `WhatsApp ${view.phoneNumber} ya puede enviar y recibir mensajes.`
                      : "Ya puedes usar este WhatsApp con easyCOMP Chat Bot Manager."}
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <DetailRow label="Número" value={view.phoneNumber} />
                <DetailRow label="phone_number_id" value={view.phoneNumberId} />
                <DetailRow label="waba_id" value={view.wabaId} />
                <DetailRow label="business_id" value={view.metaBusinessId} />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleConnect}
                disabled={busy || !sdkReady}
              >
                Reconectar con Meta
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Pulsa Conectar con Meta.</li>
                <li>Inicia sesión con la cuenta Tester o del negocio.</li>
                <li>Elige el portafolio, la cuenta WABA y el número.</li>
                <li>Al terminar verás el número y su estado conectado aquí.</li>
              </ol>

              {sdkError && (
                <p className="flex items-start gap-2 text-sm text-destructive">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  {sdkError}
                </p>
              )}

              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleConnect}
                disabled={busy || !sdkReady}
                className="inline-flex h-11 min-w-[220px] items-center justify-center gap-1.5 rounded-lg bg-[#1877F2] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1877F2]/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Smartphone className="size-4" />
                )}
                {status === "completing"
                  ? "Guardando conexión…"
                  : status === "connecting"
                    ? "Esperando a Meta…"
                    : "Conectar con Meta"}
              </button>
              {!sdkReady && !sdkError && (
                <p className="text-xs text-muted-foreground">Cargando Facebook SDK…</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
