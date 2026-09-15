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
  laterTimestamp,
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

function samePendingSet(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

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
  const [hasSyncedPending, setHasSyncedPending] = useState(false);
  const lastReadRef = useRef(lastReadAt);
  lastReadRef.current = lastReadAt;
  const prevPendingIdsRef = useRef<Set<string> | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  const activeConversationId = useMemo(() => {
    const match = pathname.match(/\/app\/conversations\/([^/?]+)/);
    const id = match?.[1];
    return id && id !== "conversations" ? id : null;
  }, [pathname]);
  activeConversationIdRef.current = activeConversationId;

  useEffect(() => {
    setLastReadAt(loadLastReadMap());
    setIsHydrated(true);
  }, []);

  const markConversationRead = useCallback((conversationId: string, messages: Message[]) => {
    const latest = getLatestSeenTimestamp(messages);
    const current = lastReadRef.current[conversationId];
    const nextAt = current ? laterTimestamp(current, latest) : latest;
    lastReadRef.current = { ...lastReadRef.current, [conversationId]: nextAt };
    setLastReadAt((prev) => {
      if (prev[conversationId] === nextAt) return prev;
      const next = { ...prev, [conversationId]: nextAt };
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
    if (conversationId === activeConversationIdRef.current) {
      pending = false;
    }
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
      if (conversationId === activeConversationIdRef.current) {
        markConversationRead(conversationId, messages);
        return;
      }
      const lastRead = lastReadRef.current[conversationId];
      setPending(conversationId, hasUnreadCustomerActivity(messages, lastRead));
    },
    [markConversationRead, setPending]
  );

  useEffect(() => {
    if (!isHydrated || !hasSyncedPending) return;
    const prev = prevPendingIdsRef.current;
    if (prev == null) {
      prevPendingIdsRef.current = new Set(pendingIds);
      return;
    }
    let addedUnread = false;
    for (const id of pendingIds) {
      if (!prev.has(id)) {
        addedUnread = true;
        break;
      }
    }
    if (addedUnread) {
      playNotificationSound();
    }
    prevPendingIdsRef.current = new Set(pendingIds);
  }, [isHydrated, hasSyncedPending, pendingIds]);

  useEffect(() => {
    if (!businessId || !isHydrated) return;

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

      const lastRead = { ...lastReadRef.current };
      const nextPending = new Set<string>();
      const openId = activeConversationIdRef.current;
      let lastReadChanged = false;

      for (const [convId, activityAt] of activityByConversation) {
        if (convId === openId) continue;
        if (!lastRead[convId]) {
          lastRead[convId] = activityAt;
          lastReadChanged = true;
          continue;
        }
        if (isUnreadActivity(activityAt, lastRead[convId])) {
          nextPending.add(convId);
        }
      }

      if (lastReadChanged) {
        lastReadRef.current = lastRead;
        setLastReadAt(lastRead);
        saveLastReadMap(lastRead);
      }

      setPendingIds((prev) => (samePendingSet(prev, nextPending) ? prev : nextPending));
      setHasSyncedPending(true);
    }

    function markPendingFromActivity(conversationId: string, activityAt: string) {
      if (conversationId === activeConversationIdRef.current) return;
      const lastRead = lastReadRef.current[conversationId];
      if (isUnreadActivity(activityAt, lastRead)) {
        setPendingIds((prev) => {
          if (prev.has(conversationId)) return prev;
          return new Set(prev).add(conversationId);
        });
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
  }, [businessId, isHydrated]);

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
