"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMBEDDED_SIGNUP_TIMEOUT_MS,
  META_EMBEDDED_SIGNUP_EVENT,
  SESSION_INFO_VERSION,
  SESSION_INFO_WAIT_MS,
  getMetaSdkConfig,
} from "@/lib/meta/embedded-signup";
import type { FacebookLoginResponse } from "@/types/facebook-sdk";
import { mapEmbeddedSignupError } from "./errors";
import type { EmbeddedSignupCapture, EmbeddedSignupMessage } from "./types";

const LOG_PREFIX = "[ES]";

function log(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(`${LOG_PREFIX} ${message}`, data);
  } else {
    console.log(`${LOG_PREFIX} ${message}`);
  }
}

function isFacebookOrigin(origin: string) {
  return (
    origin === "https://www.facebook.com" ||
    origin === "https://web.facebook.com" ||
    origin.endsWith(".facebook.com")
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function pickId(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function sessionDataFromUnknown(value: unknown): EmbeddedSignupMessage["data"] {
  const parsed = parseJsonValue(value);
  const record = asRecord(parsed);
  if (!record) return undefined;
  const nested = asRecord(parseJsonValue(record.data));
  const source = nested ?? record;
  const wabaIds = Array.isArray(source.waba_ids)
    ? source.waba_ids.map(pickId).filter((id): id is string => Boolean(id))
    : undefined;
  return {
    phone_number_id: pickId(source.phone_number_id),
    waba_id: pickId(source.waba_id) ?? wabaIds?.[0],
    business_id: pickId(source.business_id),
    waba_ids: wabaIds,
    current_step: pickId(source.current_step),
    error_message: pickId(source.error_message),
    error_id: pickId(source.error_id),
  };
}

function parseSessionMessage(data: unknown): EmbeddedSignupMessage | null {
  const parsed = parseJsonValue(data);
  const record = asRecord(parsed);
  if (!record) return null;
  const type = pickId(record.type);
  const event = pickId(record.event);
  if (type !== META_EMBEDDED_SIGNUP_EVENT && !event && !record.data) return null;
  return {
    type,
    event,
    version: typeof record.version === "number" || typeof record.version === "string"
      ? record.version
      : undefined,
    data: sessionDataFromUnknown(record.data ?? record),
  };
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function rawErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useFacebookEmbeddedSignup(backendConfigId?: string | null) {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const sessionRef = useRef<EmbeddedSignupCapture>({});
  const initializedRef = useRef(false);
  const cancelRef = useRef<(() => void) | null>(null);

  const applySessionMessage = useCallback((message: EmbeddedSignupMessage) => {
    if (message.type && message.type !== META_EMBEDDED_SIGNUP_EVENT) return;
    
    log("Meta postMessage recibido:", {
      type: message.type,
      event: message.event,
      version: message.version,
      current_step: message.data?.current_step,
      has_waba_id: Boolean(message.data?.waba_id),
      has_phone_number_id: Boolean(message.data?.phone_number_id),
      has_error_message: Boolean(message.data?.error_message),
      error_id: message.data?.error_id,
    });
    
    const next: EmbeddedSignupCapture = {
      ...sessionRef.current,
      event: message.event ?? sessionRef.current.event,
      phone_number_id: message.data?.phone_number_id ?? sessionRef.current.phone_number_id,
      waba_id: message.data?.waba_id ?? sessionRef.current.waba_id,
      business_id: message.data?.business_id ?? sessionRef.current.business_id,
    };
    sessionRef.current = next;
    return next;
  }, []);

  const initSdk = useCallback(() => {
    const { appId, configId, graphVersion } = getMetaSdkConfig(backendConfigId);
    const facebook = window.FB;
    
    log("Inicializando SDK de Meta:", {
      config_id: configId,
      config_source: backendConfigId ? "backend" : "env/fallback",
      app_id_present: Boolean(appId),
      graph_version: graphVersion,
      sdk_ready: Boolean(facebook?.init && facebook.login),
      already_initialized: initializedRef.current,
    });
    
    if (!appId) {
      setSdkError(mapEmbeddedSignupError({ kind: "config" }));
      return false;
    }
    if (!facebook?.init || !facebook.login) return false;
    if (!initializedRef.current) {
      facebook.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: graphVersion,
      });
      initializedRef.current = true;
      log("SDK inicializado correctamente");
    }
    setSdkReady(true);
    setSdkError(null);
    return true;
  }, [backendConfigId]);

  useEffect(() => {
    const { appId } = getMetaSdkConfig(backendConfigId);
    if (!appId) {
      setSdkError(mapEmbeddedSignupError({ kind: "config" }));
      return;
    }

    window.fbAsyncInit = () => {
      initSdk();
    };

    if (initSdk()) return;

    const timeout = window.setTimeout(() => {
      if (!window.FB?.login) {
        setSdkError(mapEmbeddedSignupError({ kind: "sdk" }));
      }
    }, 12000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [backendConfigId, initSdk]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isFacebookOrigin(event.origin)) return;
      const parsed = parseSessionMessage(event.data);
      if (!parsed) return;
      applySessionMessage(parsed);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [applySessionMessage]);

  const launch = useCallback((): Promise<EmbeddedSignupCapture> => {
    const { configId } = getMetaSdkConfig(backendConfigId);
    const facebook = window.FB;
    const login = facebook?.login;
    
    log("Lanzando Embedded Signup:", {
      config_id: configId,
      config_source: backendConfigId ? "backend" : "env/fallback",
      sdk_initialized: initializedRef.current,
      login_available: Boolean(login),
    });
    
    if (!configId) {
      return Promise.reject(new Error(mapEmbeddedSignupError({ kind: "config" })));
    }
    if (!login) {
      return Promise.reject(new Error(mapEmbeddedSignupError({ kind: "sdk" })));
    }
    
    // NO reinicializar el SDK aquí — esto podría invalidar el callback pendiente
    if (!initializedRef.current) {
      log("SDK no inicializado, rechazando launch");
      return Promise.reject(new Error(mapEmbeddedSignupError({ kind: "sdk" })));
    }

    sessionRef.current = {};

    return new Promise<EmbeddedSignupCapture>((resolve, reject) => {
      let settled = false;
      const timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        log("Timeout alcanzado (60s)");
        reject(new Error(mapEmbeddedSignupError({ kind: "timeout" })));
      }, EMBEDDED_SIGNUP_TIMEOUT_MS);

      const finish = (capture: EmbeddedSignupCapture, error?: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        cancelRef.current = null;
        if (error) {
          log("Launch finalizado con error:", { error: error.message });
          reject(error);
        } else {
          log("Launch finalizado exitosamente:", {
            has_code: Boolean(capture.code),
            has_waba_id: Boolean(capture.waba_id),
            has_phone_number_id: Boolean(capture.phone_number_id),
            event: capture.event,
          });
          resolve(capture);
        }
      };
      
      // Función de cancelación
      cancelRef.current = () => {
        log("Launch cancelado manualmente");
        finish(sessionRef.current, new Error(mapEmbeddedSignupError({ kind: "cancelled" })));
      };

      try {
        login(
          (response: FacebookLoginResponse) => {
            log("FB.login callback recibido:", {
              status: response.status,
              has_authResponse: Boolean(response.authResponse),
              has_code: Boolean(response.authResponse?.code),
            });
            
            const code = response.authResponse?.code;
            if (code) {
              sessionRef.current = { ...sessionRef.current, code };
              const hasSessionIds = () =>
                Boolean(sessionRef.current.waba_id && sessionRef.current.phone_number_id);
              const settle = () => finish({ ...sessionRef.current, code });
              if (hasSessionIds()) {
                settle();
                return;
              }
              const started = Date.now();
              const poll = () => {
                if (hasSessionIds()) {
                  settle();
                  return;
                }
                if (Date.now() - started >= SESSION_INFO_WAIT_MS) {
                  log("Session info wait timeout (8s), finalizando sin IDs");
                  finish(
                    sessionRef.current,
                    new Error(mapEmbeddedSignupError({ kind: "missing_session" }))
                  );
                  return;
                }
                void wait(150).then(poll);
              };
              poll();
              return;
            }

            // No hay code en authResponse
            const event = sessionRef.current.event;
            
            // Caso especial: evento FINISH sin code
            if (event?.startsWith("FINISH")) {
              const hasSessionData = Boolean(
                sessionRef.current.waba_id && sessionRef.current.phone_number_id
              );
              log("Evento FINISH sin code:", {
                event,
                has_waba_id: Boolean(sessionRef.current.waba_id),
                has_phone_number_id: Boolean(sessionRef.current.phone_number_id),
              });
              finish(
                sessionRef.current,
                new Error(
                  `Meta envió ${event} con ${hasSessionData ? "waba_id y phone_number_id" : "datos incompletos"} pero sin code de autorización. ` +
                  "Esto indica un problema en la configuración de la app de Meta o permisos faltantes."
                )
              );
              return;
            }
            
            if (event === "CANCEL") {
              finish(sessionRef.current, new Error(mapEmbeddedSignupError({ kind: "cancelled", event })));
              return;
            }
            if (event === "ERROR") {
              finish(sessionRef.current, new Error(mapEmbeddedSignupError({ event: "ERROR" })));
              return;
            }
            if (response.status === "unknown") {
              finish(
                sessionRef.current,
                new Error(mapEmbeddedSignupError({ kind: "popup" }))
              );
              return;
            }
            finish(
              sessionRef.current,
              new Error(mapEmbeddedSignupError({ kind: "cancelled" }))
            );
          },
          {
            config_id: configId,
            response_type: "code",
            override_default_response_type: true,
            extras: {
              setup: {},
              sessionInfoVersion: SESSION_INFO_VERSION,
            },
          }
        );
      } catch (error) {
        finish(
          sessionRef.current,
          new Error(
            mapEmbeddedSignupError({
              kind: "login",
              rawError: rawErrorMessage(error),
            })
          )
        );
      }
    });
  }, [backendConfigId]);

  const cancel = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
    }
  }, []);

  return { sdkReady, sdkError, launch, cancel, initSdk };
}
