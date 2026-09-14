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

export function useFacebookEmbeddedSignup() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const sessionRef = useRef<EmbeddedSignupCapture>({});
  const initializedRef = useRef(false);

  const applySessionMessage = useCallback((message: EmbeddedSignupMessage) => {
    if (message.type && message.type !== META_EMBEDDED_SIGNUP_EVENT) return;
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
    const { appId, graphVersion } = getMetaSdkConfig();
    const facebook = window.FB;
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
    }
    setSdkReady(true);
    setSdkError(null);
    return true;
  }, []);

  useEffect(() => {
    const { appId } = getMetaSdkConfig();
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
  }, [initSdk]);

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
    const { configId } = getMetaSdkConfig();
    const facebook = window.FB;
    const login = facebook?.login;
    if (!configId) {
      return Promise.reject(new Error(mapEmbeddedSignupError({ kind: "config" })));
    }
    if (!login) {
      return Promise.reject(new Error(mapEmbeddedSignupError({ kind: "sdk" })));
    }
    if (!initializedRef.current) {
      initSdk();
    }

    sessionRef.current = {};

    return new Promise<EmbeddedSignupCapture>((resolve, reject) => {
      let settled = false;
      const timeoutId = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error(mapEmbeddedSignupError({ kind: "timeout" })));
      }, EMBEDDED_SIGNUP_TIMEOUT_MS);

      const finish = (capture: EmbeddedSignupCapture, error?: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        if (error) reject(error);
        else resolve(capture);
      };

      try {
        login(
          (response: FacebookLoginResponse) => {
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

            const event = sessionRef.current.event;
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
  }, [initSdk]);

  return { sdkReady, sdkError, launch, initSdk };
}
