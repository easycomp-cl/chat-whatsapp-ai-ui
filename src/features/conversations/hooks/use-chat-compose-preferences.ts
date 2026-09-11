"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CHAT_COMPOSE_PREFS_CHANGED,
  loadChatComposePrefs,
  setEnterToSendPref,
  type ChatComposePrefs,
} from "@/lib/conversations/chat-compose-preferences";

export function useChatComposePreferences() {
  const [userId, setUserId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<ChatComposePrefs | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const id = data.user?.id ?? null;
      setUserId(id);
      setPrefs(id ? loadChatComposePrefs(id) : { enterToSend: false });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    function onPrefsChanged(event: Event) {
      const detail = (event as CustomEvent<{ userId?: string; enterToSend?: boolean }>).detail;
      if (!userId || (detail?.userId && detail.userId !== userId)) return;
      setPrefs(loadChatComposePrefs(userId));
    }

    window.addEventListener(CHAT_COMPOSE_PREFS_CHANGED, onPrefsChanged);
    return () => window.removeEventListener(CHAT_COMPOSE_PREFS_CHANGED, onPrefsChanged);
  }, [userId]);

  const updateEnterToSend = useCallback(
    (enterToSend: boolean) => {
      if (!userId) return;
      const next = { enterToSend };
      setPrefs(next);
      setEnterToSendPref(userId, enterToSend);
    },
    [userId]
  );

  return {
    ready: prefs !== null,
    enterToSend: prefs?.enterToSend ?? false,
    setEnterToSend: updateEnterToSend,
  };
}
