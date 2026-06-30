"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadLastReadMap, saveLastReadMap } from "@/lib/conversations/last-read-storage";
import {
  collectActivityFromMessages,
  getLatestSeenTimestamp,
  isUnreadActivity,
  hasUnreadCustomerActivity,
  mergeConversationActivity,
} from "@/lib/conversations/pending-activity";
import { playNotificationSound } from "@/lib/notifications/play-notification-sound";
import type { Message, MessageReactionRow } from "@/types/database.types";

const POLL_MS = 5000;

type PendingMessagesContextValue = {
  hasPending: (conversationId: string) => boolean;
  pendingCount: number;
  lastReadAt: Record<string, string>;
  markConversationRead: (conversationId: string, messages: Message[]) => void;
  syncConversationMessages: (conversationId: string, messages: Message[]) => void;
};

const PendingMessagesContext = createContext<PendingMessagesContextValue | null>(null);

export function PendingMessagesProvider({
  businessId,
  children,
}: {
  businessId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [lastReadAt, setLastReadAt] = useState<Record<string, string>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);
  const lastReadRef = useRef(lastReadAt);
  lastReadRef.current = lastReadAt;
  const prevPendingCountRef = useRef<number | null>(null);

  useEffect(() => {
    setLastReadAt(loadLastReadMap());
    setIsHydrated(true);
  }, []);

  const activeConversationId = useMemo(() => {
    const match = pathname.match(/\/app\/conversations\/([^/?]+)/);
    const id = match?.[1];
    return id && id !== "conversations" ? id : null;
  }, [pathname]);

  const markConversationRead = useCallback((conversationId: string, messages: Message[]) => {
    const latest = getLatestSeenTimestamp(messages);
    setLastReadAt((prev) => {
      const next = { ...prev, [conversationId]: latest };
      saveLastReadMap(next);
      return next;
    });
    setPendingIds((prev) => {
      if (!prev.has(conversationId)) return prev;
      const next = new Set(prev);
      next.delete(conversationId);
      return next;
    });
  }, []);

  const setPending = useCallback((conversationId: string, pending: boolean) => {
    setPendingIds((prev) => {
      const has = prev.has(conversationId);
      if (pending && has) return prev;
      if (!pending && !has) return prev;
      const next = new Set(prev);
      if (pending) next.add(conversationId);
      else next.delete(conversationId);
      return next;
    });
  }, []);

  const syncConversationMessages = useCallback(
    (conversationId: string, messages: Message[]) => {
      const lastRead = lastReadRef.current[conversationId];
      setPending(conversationId, hasUnreadCustomerActivity(messages, lastRead));
    },
    [setPending]
  );

  useEffect(() => {
    if (!isHydrated) return;
    const prev = prevPendingCountRef.current;
    if (prev !== null && pendingIds.size > prev) {
      playNotificationSound();
    }
    prevPendingCountRef.current = pendingIds.size;
  }, [isHydrated, pendingIds.size]);

  useEffect(() => {
    if (!businessId) return;

    const supabase = createClient();

    async function syncAllPending() {
      const activityByConversation = new Map<string, string>();

      const { data: messages } = await supabase
        .from("messages")
        .select("conversation_id, direction, created_at, reactions")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(500);

      for (const [convId, at] of collectActivityFromMessages(messages ?? [])) {
        mergeConversationActivity(activityByConversation, convId, at);
      }

      const { data: reactions } = await supabase
        .from("MessageReaction")
        .select("conversationId, createdAt, senderType, emoji")
        .eq("tenantId", businessId)
        .eq("senderType", "CUSTOMER")
        .order("createdAt", { ascending: false })
        .limit(300);

      for (const row of (reactions ?? []) as Pick<
        MessageReactionRow,
        "conversationId" | "createdAt" | "senderType" | "emoji"
      >[]) {
        if (!row.emoji) continue;
        mergeConversationActivity(activityByConversation, row.conversationId, row.createdAt);
      }

      const nextPending = new Set<string>();
      const lastRead = lastReadRef.current;

      for (const [convId, activityAt] of activityByConversation) {
        if (convId === activeConversationId) continue;
        if (isUnreadActivity(activityAt, lastRead[convId])) {
          nextPending.add(convId);
        }
      }

      setPendingIds(nextPending);
    }

    function markPendingFromActivity(conversationId: string, activityAt: string) {
      if (conversationId === activeConversationId) return;
      const lastRead = lastReadRef.current[conversationId];
      if (isUnreadActivity(activityAt, lastRead)) {
        setPendingIds((prev) => new Set(prev).add(conversationId));
      }
    }

    void syncAllPending();
    const interval = setInterval(syncAllPending, POLL_MS);

    const channel = supabase
      .channel(`pending-messages-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `tenantId=eq.${businessId}`,
        },
        (payload) => {
          const row = payload.new as {
            conversationId: string;
            direction: string;
            createdAt: string;
          };
          if (row.direction !== "INBOUND") return;
          markPendingFromActivity(row.conversationId, row.createdAt);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "MessageReaction",
          filter: `tenantId=eq.${businessId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            conversationId?: string;
            createdAt?: string;
            senderType?: string;
            emoji?: string;
          };
          if (row.senderType !== "CUSTOMER") return;
          if (payload.eventType === "DELETE" || !row.emoji) {
            void syncAllPending();
            return;
          }
          if (!row.conversationId || !row.createdAt) return;
          markPendingFromActivity(row.conversationId, row.createdAt);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [businessId, activeConversationId]);

  const hasPending = useCallback(
    (conversationId: string) => isHydrated && pendingIds.has(conversationId),
    [isHydrated, pendingIds]
  );

  const value = useMemo(
    () => ({
      hasPending,
      pendingCount: isHydrated ? pendingIds.size : 0,
      lastReadAt,
      markConversationRead,
      syncConversationMessages,
    }),
    [
      hasPending,
      isHydrated,
      pendingIds.size,
      lastReadAt,
      markConversationRead,
      syncConversationMessages,
    ]
  );

  return (
    <PendingMessagesContext.Provider value={value}>
      {children}
    </PendingMessagesContext.Provider>
  );
}

export function usePendingMessages() {
  const ctx = useContext(PendingMessagesContext);
  if (!ctx) {
    return {
      hasPending: () => false,
      pendingCount: 0,
      lastReadAt: {},
      markConversationRead: () => {},
      syncConversationMessages: () => {},
    };
  }
  return ctx;
}
