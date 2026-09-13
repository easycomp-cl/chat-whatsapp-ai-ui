"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
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
import {
  completeWhatsappEmbeddedSignupAction,
  type CompleteEmbeddedSignupResult,
} from "@/lib/actions/whatsapp-onboarding-actions";
import { WHATSAPP_CALLBACK_PATH } from "@/lib/meta/embedded-signup";
import { mapEmbeddedSignupError } from "../errors";
import { saveWhatsappSignupSnapshot } from "../session-store";
import { useFacebookEmbeddedSignup } from "../use-facebook-embedded-signup";
import type { WhatsappConnectUiStatus, WhatsappConnectionView } from "../types";

function resultToView(
  result: CompleteEmbeddedSignupResult,
  fallback?: Partial<WhatsappConnectionView>
): WhatsappConnectionView {
  const status: WhatsappConnectUiStatus = result.backendPending
    ? "authorized_pending_backend"
    : "connected";
  return {
    connected: result.connected,
    persisted: result.persisted,
    backendPending: result.backendPending,
    status,
    phoneNumber: result.phone_number ?? fallback?.phoneNumber ?? null,
    phoneNumberId: result.phone_number_id ?? fallback?.phoneNumberId ?? null,
    wabaId: result.waba_id ?? fallback?.wabaId ?? null,
    metaBusinessId: result.business_id ?? fallback?.metaBusinessId ?? null,
    message: result.message ?? null,
  };
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
  };
};

export function ConnectWhatsappPanel({
  initialConnection,
  autoComplete,
}: ConnectWhatsappPanelProps) {
  const router = useRouter();
  const { sdkReady, sdkError, launch, initSdk } = useFacebookEmbeddedSignup();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<WhatsappConnectUiStatus>(
    initialConnection?.status === "connected"
      ? "connected"
      : initialConnection?.status === "authorized_pending_backend"
        ? "authorized_pending_backend"
        : "idle"
  );
  const [view, setView] = useState<WhatsappConnectionView | null>(initialConnection ?? null);
  const [error, setError] = useState<string | null>(null);
  const [autoRan, setAutoRan] = useState(false);

  const busy = pending || status === "connecting" || status === "completing" || status === "sdk_loading";

  const persistCapture = useCallback(
    (capture: {
      code?: string | null;
      waba_id?: string | null;
      phone_number_id?: string | null;
      business_id?: string | null;
    }) => {
      const code = capture.code?.trim();
      if (!code) {
        throw new Error(mapEmbeddedSignupError({ kind: "missing_code" }));
      }

      setStatus("completing");
      startTransition(async () => {
        try {
          const result = await completeWhatsappEmbeddedSignupAction({
            code,
            waba_id: capture.waba_id,
            phone_number_id: capture.phone_number_id,
            business_id: capture.business_id,
          });
          const next = resultToView(result, {
            phoneNumberId: capture.phone_number_id,
            wabaId: capture.waba_id,
            metaBusinessId: capture.business_id,
          });
          setView(next);
          saveWhatsappSignupSnapshot(next);
          setStatus(next.status);
          if (next.backendPending) {
            toast.warning("Autorizado en Meta", {
              description: next.message ?? mapEmbeddedSignupError({ kind: "backend_pending" }),
            });
          } else {
            toast.success("WhatsApp conectado");
          }
          if (!window.location.pathname.endsWith("/callback")) {
            router.replace(WHATSAPP_CALLBACK_PATH);
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : mapEmbeddedSignupError({ kind: "unknown" });
          setStatus("error");
          setError(message);
          toast.error("No se pudo completar la conexión", { description: message });
        }
      });
    },
    [router]
  );

  useEffect(() => {
    if (autoRan) return;
    if (!autoComplete) return;

    if (autoComplete.error) {
      setAutoRan(true);
      const message = mapEmbeddedSignupError({
        facebookError: autoComplete.error,
        facebookReason: autoComplete.errorReason,
        facebookDescription: autoComplete.errorDescription,
      });
      setStatus(autoComplete.error === "access_denied" ? "cancelled" : "error");
      setError(message);
      return;
    }

    if (autoComplete.code) {
      setAutoRan(true);
      persistCapture({
        code: autoComplete.code,
        waba_id: view?.wabaId,
        phone_number_id: view?.phoneNumberId,
        business_id: view?.metaBusinessId,
      });
    }
  }, [autoComplete, autoRan, persistCapture, view]);

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
          const message =
            err instanceof Error ? err.message : mapEmbeddedSignupError({ kind: "unknown" });
          setStatus("error");
          setError(message);
        }
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : mapEmbeddedSignupError({ kind: "unknown" });
        const cancelled = message.toLowerCase().includes("cancelaste");
        setStatus(cancelled ? "cancelled" : "error");
        setError(message);
      });
  }

  const statusBadge = useMemo(() => {
    if (status === "connected") {
      return <Badge className="bg-emerald-600 text-white">Conectado</Badge>;
    }
    if (status === "authorized_pending_backend") {
      return <Badge variant="outline">Autorizado en Meta</Badge>;
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

  const showSuccess =
    (status === "connected" || status === "authorized_pending_backend") && view;

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
                  <p className="font-semibold">
                    {view.backendPending ? "Número autorizado en Meta" : "Número conectado"}
                  </p>
                  <p className="text-sm text-emerald-800/80">
                    {view.backendPending
                      ? mapEmbeddedSignupError({ kind: "backend_pending" })
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
