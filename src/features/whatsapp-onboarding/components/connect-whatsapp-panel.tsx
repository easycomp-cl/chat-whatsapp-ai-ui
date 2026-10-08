"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
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
import { PinVerificationDialog } from "./pin-verification-dialog";
import { PlanCheckoutModal } from "@/features/billing/components/plan-checkout-modal";
import { isNeedsBillingCheckout } from "@/lib/billing/pending-selection";
import type { CompleteEmbeddedSignupInput, WhatsappConnectUiStatus, WhatsappConnectionView } from "../types";

const LOG_PREFIX = "[ES]";

function log(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(`${LOG_PREFIX} ${message}`, data);
  } else {
    console.log(`${LOG_PREFIX} ${message}`);
  }
}

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
  const { 
    sdkReady, 
    sdkError, 
    launch, 
    cancel, 
    initSdk,
    getCurrentCapture,
    getCurrentAttemptId,
    consumeCapture,
  } = useFacebookEmbeddedSignup(
    initialConnection?.metaConfigId
  );
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<WhatsappConnectUiStatus>(
    initialConnection?.connected ? "connected" : "idle"
  );
  const [view, setView] = useState<WhatsappConnectionView | null>(
    initialConnection?.connected ? initialConnection : null
  );
  const [error, setError] = useState<string | null>(null);
  const [autoRan, setAutoRan] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingCapture, setPendingCapture] = useState<{
    code?: string | null;
    waba_id?: string | null;
    phone_number_id?: string | null;
    business_id?: string | null;
    redirect_uri?: string | null;
  } | null>(null);
  const [needsBilling, setNeedsBilling] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const currentFlowAttemptIdRef = useRef<string | null>(null);

  const busy = pending || status === "connecting" || status === "completing" || status === "sdk_loading";

  const persistCapture = useCallback(
    (
      capture: {
        code?: string | null;
        waba_id?: string | null;
        phone_number_id?: string | null;
        business_id?: string | null;
        redirect_uri?: string | null;
      },
      pin: string
    ) => {
      const code = capture.code?.trim();
      if (!code) {
        throw new Error(mapEmbeddedSignupError({ kind: "missing_code" }));
      }

      if (!pin?.trim() || !/^\d{6}$/.test(pin.trim())) {
        throw new Error("El PIN debe ser exactamente 6 dígitos.");
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
      setPinDialogOpen(false);
      setPendingCapture(null);

      startTransition(async () => {
        try {
          const input: CompleteEmbeddedSignupInput = { code, pin: pin.trim() };
          if (wabaId) input.waba_id = wabaId;
          if (phoneNumberId) input.phone_number_id = phoneNumberId;
          if (businessId) input.business_id = businessId;
          if (redirectUri) input.redirect_uri = redirectUri;

          log("Iniciando POST a embedded-signup/complete", {
            code_length: code.length,
            has_waba_id: Boolean(wabaId),
            has_phone_number_id: Boolean(phoneNumberId),
            has_business_id: Boolean(businessId),
            has_redirect_uri: Boolean(redirectUri),
          });

          const startTime = Date.now();
          const result = await completeWhatsappEmbeddedSignupAction(input);
          const duration = Date.now() - startTime;

          log("POST a embedded-signup/complete completado", {
            duration_ms: duration,
            success: result.ok,
            has_connection: Boolean(result.connection),
          });
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
    void isNeedsBillingCheckout().then(setNeedsBilling);
  }, []);

  useEffect(() => {
    if (status !== "connected" || !needsBilling) return;
    setPlanOpen(true);
  }, [status, needsBilling]);

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
    const capture = {
      code: urlCode,
      waba_id: snap?.wabaId ?? view?.wabaId,
      phone_number_id: snap?.phoneNumberId ?? view?.phoneNumberId,
      business_id: snap?.metaBusinessId ?? view?.metaBusinessId,
      redirect_uri: redirectUri,
    };
    setPendingCapture(capture);
    log("Diálogo de PIN mostrado", {
      attempt_id: capture.waba_id,
      source: redirectUri ? "autoComplete_url" : "autoComplete_tardy",
    });
    setPinDialogOpen(true);
    if (searchParams.toString()) {
      router.replace(pathname);
    }
  }, [autoComplete, autoRan, pathname, persistCapture, router, searchParams, view]);

  function handleConnect() {
    setError(null);
    setStatus("connecting");
    
    // launch() limpia attemptId al inicio, luego lo genera si pasa validaciones
    const launchPromise = launch();
    
    // Obtener attemptId (puede ser null si launch rechazó síncronamente)
    const attemptId = getCurrentAttemptId();
    
    if (!attemptId) {
      // launch() rechazó de forma síncrona (SDK no listo, config faltante)
      log("launch rechazado síncronamente, no hay attemptId");
      // Adjuntar .catch() para manejar el rechazo y no dejar status en 'connecting'
      launchPromise.catch((err: unknown) => {
        const message = clientActionErrorMessage(err);
        setStatus("error");
        setError(message);
      });
      return;
    }
    
    currentFlowAttemptIdRef.current = attemptId;
    log("Iniciando conexión", { attempt_id: attemptId });
    
    launchPromise
      .then((capture) => {
        try {
          const captureData = {
            code: capture.code,
            waba_id: capture.waba_id,
            phone_number_id: capture.phone_number_id,
            business_id: capture.business_id,
          };
          
          // Marcar code como consumido para evitar procesamiento doble
          log("Code consumido en flujo normal", { attempt_id: attemptId });
          currentFlowAttemptIdRef.current = null;
          consumeCapture(); // Limpiar code del sessionRef en el hook
          
          setPendingCapture(captureData);
          setStatus("idle");
          log("Diálogo de PIN mostrado", {
            attempt_id: capture.waba_id,
            source: "launch_normal",
          });
          setPinDialogOpen(true);
        } catch (err: unknown) {
          const message = clientActionErrorMessage(err);
          currentFlowAttemptIdRef.current = null;
          consumeCapture();
          setStatus("error");
          setError(message);
        }
      })
      .catch((err: unknown) => {
        const message = clientActionErrorMessage(err);
        const cancelled = message.toLowerCase().includes("cancelaste");
        setStatus(cancelled ? "cancelled" : "error");
        setError(message);
        
        // Si fue timeout (NO cancelación), el attemptId sigue válido para callbacks tardíos
        if (cancelled) {
          currentFlowAttemptIdRef.current = null;
        } else {
          log("Error en launch (timeout), esperando posibles callbacks tardíos", {
            attempt_id: attemptId,
          });
          // NO limpiar currentFlowAttemptIdRef aquí para permitir procesamiento tardío
        }
      });
  }

  function handleCancel() {
    cancel();
    currentFlowAttemptIdRef.current = null;
    setStatus("cancelled");
    setError("Conexión cancelada. Puedes intentarlo de nuevo cuando quieras.");
  }

  function handlePinConfirm(pin: string) {
    if (!pendingCapture) return;
    const isValid = /^\d{6}$/.test(pin.trim());
    log("PIN enviado", {
      pin_length: pin.trim().length,
      is_valid: isValid,
    });
    try {
      persistCapture(pendingCapture, pin);
    } catch (err: unknown) {
      const message = clientActionErrorMessage(err);
      setStatus("error");
      setError(message);
      setPinDialogOpen(false);
      setPendingCapture(null);
    }
  }

  function handlePinCancel() {
    log("Diálogo de PIN cancelado");
    setPinDialogOpen(false);
    setPendingCapture(null);
    setStatus("cancelled");
    setError("Conexión cancelada. No se ingresó el PIN de verificación.");
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

  // Effect para detectar callbacks tardíos (code que llega después del timeout)
  useEffect(() => {
    if (status !== "error" || !currentFlowAttemptIdRef.current) return;
    
    const checkInterval = setInterval(() => {
      const capture = getCurrentCapture();
      const attemptId = getCurrentAttemptId();
      
      if (!capture?.code || !attemptId) return;
      
      // Verificar que sea del mismo intento
      if (attemptId !== currentFlowAttemptIdRef.current) {
        log("Code tardío ignorado (intento diferente)", {
          current_attempt: currentFlowAttemptIdRef.current,
          capture_attempt: attemptId,
        });
        return;
      }
      
      log("Code tardío detectado, procesando automáticamente", {
        attempt_id: attemptId,
        has_waba_id: Boolean(capture.waba_id),
        has_phone_number_id: Boolean(capture.phone_number_id),
      });
      
      // Marcar code como consumido ANTES de procesar para evitar doble disparo
      currentFlowAttemptIdRef.current = null;
      consumeCapture(); // Limpiar code del sessionRef en el hook
      clearInterval(checkInterval);
      
      // Limpiar error y procesar el code
      setError(null);
      setStatus("idle");
      
      const captureData = {
        code: capture.code,
        waba_id: capture.waba_id,
        phone_number_id: capture.phone_number_id,
        business_id: capture.business_id,
      };
      setPendingCapture(captureData);
      setPinDialogOpen(true);
    }, 500);
    
    return () => clearInterval(checkInterval);
  }, [status, getCurrentCapture, getCurrentAttemptId, consumeCapture]);

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

      <PinVerificationDialog
        open={pinDialogOpen}
        onConfirm={handlePinConfirm}
        onCancel={handlePinCancel}
        busy={busy}
      />

      <PlanCheckoutModal
        open={planOpen}
        onOpenChange={setPlanOpen}
        required={needsBilling}
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
              <div className="flex flex-wrap gap-2">
                {needsBilling ? (
                  <Button type="button" onClick={() => setPlanOpen(true)}>
                    Elegir plan
                  </Button>
                ) : (
                  <Button type="button" render={<Link href="/app/dashboard" />}>
                    Ir al dashboard
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConnect}
                  disabled={busy || !sdkReady}
                >
                  Reconectar con Meta
                </Button>
              </div>
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
                  ? "Finalizando conexión con Meta…"
                  : status === "connecting"
                    ? "Esperando a Meta…"
                    : "Conectar con Meta"}
              </button>
              
              {status === "connecting" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={status !== "connecting"}
                >
                  Cancelar
                </Button>
              )}
              
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
