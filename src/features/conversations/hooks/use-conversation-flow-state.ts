"use client";

import { useEffect, useState } from "react";
import { fetchConversationFlowStateAction } from "@/lib/actions/flow-actions";
import type { ConversationFlowState } from "@/lib/bot-api/types";

/** Poll rápido mientras hay un flow run activo (banner, input de agente, etc.). */
const POLL_ACTIVE_MS = 2500;
/** Sin flow activo: detectar uno nuevo sin spamear el servidor ni la terminal. */
const POLL_IDLE_MS = 30000;

function pollIntervalMs(state: ConversationFlowState | null): number {
  return state?.active_flow_run != null ? POLL_ACTIVE_MS : POLL_IDLE_MS;
}

export function useConversationFlowState(
  conversationId: string,
  initial: ConversationFlowState | null
) {
  const [flowState, setFlowState] = useState<ConversationFlowState | null>(initial);

  useEffect(() => {
    setFlowState(initial);
  }, [conversationId, initial]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function refresh() {
      const next = await fetchConversationFlowStateAction(conversationId);
      if (cancelled) return;
      if (next) setFlowState(next);
      timer = setTimeout(() => void refresh(), pollIntervalMs(next));
    }

    // initial viene del SSR; primer fetch tras el intervalo correspondiente.
    timer = setTimeout(() => void refresh(), pollIntervalMs(initial));

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [conversationId, initial]);

  return flowState;
}
