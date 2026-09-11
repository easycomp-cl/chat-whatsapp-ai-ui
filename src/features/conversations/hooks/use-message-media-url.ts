"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMessageMediaDisplayUrl } from "@/lib/conversations/fetch-message-media-url";

type CachedMediaUrl = {
  url: string;
  expiresAt: number;
  usedProxyFallback: boolean;
};

const mediaUrlCache = new Map<string, CachedMediaUrl>();
const inflightRequests = new Map<string, Promise<CachedMediaUrl>>();
const MAX_IMG_ERROR_RETRIES = 6;

function loadMediaUrl(
  messageId: string,
  forceProxy = false,
  cacheBust = Date.now()
): Promise<CachedMediaUrl> {
  const inflightKey = `${messageId}:${forceProxy ? "proxy" : "url"}:${cacheBust}`;

  const existing = inflightRequests.get(inflightKey);
  if (existing) return existing;

  const promise = fetchMessageMediaDisplayUrl(messageId, { forceProxy, cacheBust })
    .then((result) => {
      const entry: CachedMediaUrl = {
        url: result.url,
        expiresAt: result.expiresAt,
        usedProxyFallback: result.usedProxyFallback,
      };
      mediaUrlCache.set(messageId, entry);
      if (forceProxy) {
        mediaUrlCache.set(`${messageId}:proxy`, entry);
      }
      return entry;
    })
    .finally(() => {
      inflightRequests.delete(inflightKey);
    });

  inflightRequests.set(inflightKey, promise);
  return promise;
}

export function useMessageMediaUrl(messageId: string, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const imgErrorRetriesRef = useRef(0);
  const cacheBustRef = useRef(Date.now());

  const applyEntry = useCallback((entry: CachedMediaUrl) => {
    setUrl(entry.url);
    setError(false);
    imgErrorRetriesRef.current = 0;
  }, []);

  const fetchUrl = useCallback(
    async (forceProxy = false, bust?: number) => {
      if (!enabled || messageId.startsWith("optimistic-")) {
        setUrl(null);
        setError(false);
        setLoading(false);
        return;
      }

      const cacheBust = bust ?? cacheBustRef.current;
      const cached = mediaUrlCache.get(messageId);
      if (
        cached &&
        cached.expiresAt > Date.now() + 60_000 &&
        !forceProxy &&
        imgErrorRetriesRef.current === 0
      ) {
        applyEntry(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const entry = await loadMediaUrl(messageId, forceProxy, cacheBust);
        applyEntry(entry);
      } catch {
        setError(true);
        setUrl(null);
      } finally {
        setLoading(false);
      }
    },
    [applyEntry, enabled, messageId]
  );

  useEffect(() => {
    cacheBustRef.current = Date.now();
    imgErrorRetriesRef.current = 0;
    void fetchUrl(false);
  }, [fetchUrl]);

  const retry = useCallback(() => {
    mediaUrlCache.delete(messageId);
    mediaUrlCache.delete(`${messageId}:proxy`);
    imgErrorRetriesRef.current = 0;
    cacheBustRef.current = Date.now();
    void fetchUrl(false, cacheBustRef.current);
  }, [fetchUrl, messageId]);

  const retryWithProxy = useCallback(() => {
    mediaUrlCache.delete(messageId);
    mediaUrlCache.delete(`${messageId}:proxy`);
    imgErrorRetriesRef.current = 0;
    cacheBustRef.current = Date.now();
    void fetchUrl(true, cacheBustRef.current);
  }, [fetchUrl, messageId]);

  const handleMediaError = useCallback(() => {
    if (imgErrorRetriesRef.current >= MAX_IMG_ERROR_RETRIES) {
      setError(true);
      return;
    }

    imgErrorRetriesRef.current += 1;
    mediaUrlCache.delete(messageId);
    mediaUrlCache.delete(`${messageId}:proxy`);
    cacheBustRef.current = Date.now();
    setUrl(null);
    setLoading(true);
    setError(false);

    const delayMs = 400 * imgErrorRetriesRef.current;
    window.setTimeout(() => {
      void fetchUrl(true, cacheBustRef.current);
    }, delayMs);
  }, [fetchUrl, messageId]);

  return { url, loading, error, retry, retryWithProxy, handleMediaError };
}
