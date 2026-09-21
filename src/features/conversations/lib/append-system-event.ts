"use client";

import type { Message } from "@/types/database.types";

export const APPEND_SYSTEM_EVENT = "easycomp:append-system-event";

export function appendLocalSystemEvent(conversationId: string, message: Message) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(APPEND_SYSTEM_EVENT, {
      detail: { conversationId, message },
    })
  );
}
