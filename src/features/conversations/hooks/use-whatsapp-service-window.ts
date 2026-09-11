"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getWhatsappServiceWindowState,
  type WhatsappServiceWindowState,
} from "@/lib/conversations/whatsapp-service-window";
import type { Message } from "@/types/database.types";

type UseWhatsappServiceWindowParams = {
  messages: Message[];
  customerLastSeenAt?: string | null;
};

export function useWhatsappServiceWindow({
  messages,
  customerLastSeenAt,
}: UseWhatsappServiceWindowParams): WhatsappServiceWindowState {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return useMemo(
    () =>
      getWhatsappServiceWindowState({
        messages,
        customerLastSeenAt,
        now,
      }),
    [messages, customerLastSeenAt, now]
  );
}
