export const PRODUCTION_APP_ORIGIN = "https://chatbotmanager.easycomp.cl";

export const WHATSAPP_ONBOARDING_PATH = "/onboarding/whatsapp";
export const WHATSAPP_CALLBACK_PATH = "/onboarding/whatsapp/callback";
export const FACEBOOK_OAUTH_CALLBACK_PATH = "/api/auth/callback/facebook";
export const FACEBOOK_OAUTH_COOKIE = "wa_es_oauth";

export const META_EMBEDDED_SIGNUP_EVENT = "WA_EMBEDDED_SIGNUP";
export const DEFAULT_META_GRAPH_VERSION = "v25.0";
export const SESSION_INFO_VERSION = "3";

export const EMBEDDED_SIGNUP_TIMEOUT_MS = 3 * 60 * 1000;
export const SESSION_INFO_WAIT_MS = 2500;

const DEFAULT_META_APP_ID = "1642810900259407";
const DEFAULT_META_CONFIG_ID = "1919146745399628";

export function getPublicAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return PRODUCTION_APP_ORIGIN;
}

export function getFacebookOAuthRedirectUri(origin = getPublicAppOrigin()): string {
  return `${origin}${FACEBOOK_OAUTH_CALLBACK_PATH}`;
}

export function getWhatsappCallbackRedirectUri(origin = getPublicAppOrigin()): string {
  return `${origin}${WHATSAPP_CALLBACK_PATH}`;
}

export function getMetaAppId(): string {
  return process.env.NEXT_PUBLIC_META_APP_ID?.trim() || DEFAULT_META_APP_ID;
}

export function getMetaEmbeddedSignupConfigId(): string {
  return (
    process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID?.trim() ||
    DEFAULT_META_CONFIG_ID
  );
}

export function getMetaGraphVersion(): string {
  const raw = process.env.NEXT_PUBLIC_META_GRAPH_VERSION?.trim() || DEFAULT_META_GRAPH_VERSION;
  return raw.startsWith("v") ? raw : `v${raw}`;
}

export function getMetaSdkConfig(): {
  appId: string;
  configId: string;
  graphVersion: string;
} {
  return {
    appId: getMetaAppId(),
    configId: getMetaEmbeddedSignupConfigId(),
    graphVersion: getMetaGraphVersion(),
  };
}

export const META_VALID_OAUTH_REDIRECT_URIS = [
  `${PRODUCTION_APP_ORIGIN}${FACEBOOK_OAUTH_CALLBACK_PATH}`,
  `${PRODUCTION_APP_ORIGIN}${WHATSAPP_CALLBACK_PATH}`,
  `${PRODUCTION_APP_ORIGIN}${WHATSAPP_ONBOARDING_PATH}`,
] as const;
