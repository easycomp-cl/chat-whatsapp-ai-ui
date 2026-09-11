export type MessageMediaUrlPayload = {
  media_url: string;
  backend_proxy: boolean;
  expires_in_seconds: number;
};

/** 404 = media aún no ingestada en backend (común en mensajes recién llegados). */
const RETRYABLE_STATUSES = new Set([404, 502, 503, 504]);
const PROXY_CACHE_MS = 5 * 60 * 1000;
const DEFAULT_RETRIES = 5;

export function getMessageMediaFileProxyPath(messageId: string, cacheBust?: number): string {
  const base = `/api/messages/${messageId}/media/file`;
  if (cacheBust == null) return base;
  return `${base}?v=${cacheBust}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchMessageMediaDisplayUrl(
  messageId: string,
  options?: { forceProxy?: boolean; retries?: number; cacheBust?: number }
): Promise<{ url: string; expiresAt: number; usedProxyFallback: boolean }> {
  const cacheBust = options?.cacheBust ?? Date.now();
  const maxRetries = options?.retries ?? DEFAULT_RETRIES;

  if (options?.forceProxy) {
    return {
      url: getMessageMediaFileProxyPath(messageId, cacheBust),
      expiresAt: Date.now() + PROXY_CACHE_MS,
      usedProxyFallback: true,
    };
  }

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const res = await fetch(
        `/api/messages/${messageId}/media-url?expires_in=3600`,
        { credentials: "same-origin", cache: "no-store" }
      );

      if (res.ok) {
        const data = (await res.json()) as MessageMediaUrlPayload;
        const url = data.backend_proxy
          ? getMessageMediaFileProxyPath(messageId, cacheBust)
          : data.media_url;

        return {
          url,
          expiresAt: Date.now() + (data.expires_in_seconds ?? 3600) * 1000,
          usedProxyFallback: data.backend_proxy,
        };
      }

      if (RETRYABLE_STATUSES.has(res.status) && attempt < maxRetries) {
        await sleep(600 * (attempt + 1));
        continue;
      }
    } catch {
      if (attempt < maxRetries) {
        await sleep(600 * (attempt + 1));
        continue;
      }
    }

    break;
  }

  return {
    url: getMessageMediaFileProxyPath(messageId, cacheBust),
    expiresAt: Date.now() + PROXY_CACHE_MS,
    usedProxyFallback: true,
  };
}
