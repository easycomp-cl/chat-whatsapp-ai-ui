"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMBEDDED_SIGNUP_TIMEOUT_MS,
  META_EMBEDDED_SIGNUP_EVENT,
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

function parseSessionMessage(data: unknown): EmbeddedSignupMessage | null {
  if (!data) return null;
  if (typeof data === "object") {
    return data as EmbeddedSignupMessage;
  }
  if (typeof data !== "string") return null;
  try {
    return JSON.parse(data) as EmbeddedSignupMessage;
  } catch {
    return null;
  }
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
    if (message.type !== META_EMBEDDED_SIGNUP_EVENT) return;
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
              const settle = () => finish({ ...sessionRef.current, code });
              if (!sessionRef.current.waba_id && !sessionRef.current.phone_number_id) {
                void wait(SESSION_INFO_WAIT_MS).then(settle);
                return;
              }
              settle();
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
