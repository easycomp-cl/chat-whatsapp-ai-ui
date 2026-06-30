"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { findFirstPendingMessage } from "@/lib/conversations/last-read-storage";
import type { Message } from "@/types/database.types";

const NEAR_BOTTOM_THRESHOLD = 80;

type UseChatScrollOptions = {
  onAcknowledgeRead?: () => void;
};

export function useChatScroll(
  conversationId: string,
  messages: Message[],
  scrollRef: React.RefObject<HTMLDivElement | null>,
  options: UseChatScrollOptions = {}
) {
  const { onAcknowledgeRead } = options;
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isNearBottomRef = useRef(true);
  const isProgrammaticScrollRef = useRef(false);
  const prevCountRef = useRef(messages.length);
  const initialScrollDoneRef = useRef<string | null>(null);
  const onAcknowledgeReadRef = useRef(onAcknowledgeRead);
  onAcknowledgeReadRef.current = onAcknowledgeRead;

  const checkNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance < NEAR_BOTTOM_THRESHOLD;
  }, [scrollRef]);

  const acknowledgeIfAtBottom = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    if (!checkNearBottom()) return;
    isNearBottomRef.current = true;
    setShowScrollButton(false);
    onAcknowledgeReadRef.current?.();
  }, [checkNearBottom]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth", acknowledgeRead = true) => {
      const el = scrollRef.current;
      if (!el) return;
      isProgrammaticScrollRef.current = true;
      el.scrollTo({ top: el.scrollHeight, behavior });
      isNearBottomRef.current = true;
      setShowScrollButton(false);
      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        if (acknowledgeRead) {
          onAcknowledgeReadRef.current?.();
        }
      }, behavior === "smooth" ? 350 : 0);
    },
    [scrollRef]
  );

  const revealLatestMessage = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el || messages.length === 0) return;

      const lastId = messages[messages.length - 1]?.id;
      const node = lastId
        ? el.querySelector(`[data-message-id="${lastId}"]`)
        : el.querySelector("[data-message-id]:last-of-type");
      if (!node) return;

      isProgrammaticScrollRef.current = true;
      node.scrollIntoView({ behavior, block: "end" });
      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        const nearBottom = checkNearBottom();
        isNearBottomRef.current = nearBottom;
        setShowScrollButton(!nearBottom && messages.length > 0);
      }, behavior === "smooth" ? 350 : 0);
    },
    [checkNearBottom, messages, scrollRef]
  );

  const scrollToMessage = useCallback(
    (messageId: string, behavior: ScrollBehavior = "instant") => {
      const el = scrollRef.current;
      if (!el) return false;
      const node = el.querySelector(`[data-message-id="${messageId}"]`);
      if (!node) return false;
      isProgrammaticScrollRef.current = true;
      node.scrollIntoView({ behavior, block: "start" });
      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        const nearBottom = checkNearBottom();
        isNearBottomRef.current = nearBottom;
        setShowScrollButton(!nearBottom && messages.length > 0);
      }, 0);
      return true;
    },
    [checkNearBottom, messages.length, scrollRef]
  );

  const performInitialScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) return;

    const firstPending = findFirstPendingMessage(messages, conversationId);
    if (firstPending) {
      const scrolled = scrollToMessage(firstPending.id, "instant");
      if (!scrolled) {
        isProgrammaticScrollRef.current = true;
        el.scrollTop = el.scrollHeight;
        window.setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 0);
      }
    } else {
      isProgrammaticScrollRef.current = true;
      el.scrollTop = el.scrollHeight;
      isNearBottomRef.current = true;
      setShowScrollButton(false);
      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 0);
    }
  }, [conversationId, messages, scrollRef, scrollToMessage]);

  useLayoutEffect(() => {
    if (initialScrollDoneRef.current === conversationId) return;
    if (messages.length === 0) return;

    initialScrollDoneRef.current = conversationId;
    prevCountRef.current = messages.length;
    performInitialScroll();
  }, [conversationId, messages.length, performInitialScroll]);

  useEffect(() => {
    initialScrollDoneRef.current = null;
    prevCountRef.current = 0;
  }, [conversationId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function handleScroll() {
      const container = scrollRef.current;
      if (!container) return;
      const nearBottom = checkNearBottom();
      isNearBottomRef.current = nearBottom;
      setShowScrollButton(!nearBottom && messages.length > 0);
      if (nearBottom) {
        acknowledgeIfAtBottom();
      }
    }

    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [acknowledgeIfAtBottom, checkNearBottom, scrollRef, messages.length]);

  const reactionsSignature = messages
    .flatMap((m) => (m.reactions ?? []).map((r) => `${m.id}:${r.emoji}:${r.created_at}`))
    .join("|");

  useEffect(() => {
    const grew = messages.length > prevCountRef.current;
    const wasNearBottom = isNearBottomRef.current;
    prevCountRef.current = messages.length;

    if (!grew) return;

    if (wasNearBottom) {
      requestAnimationFrame(() => scrollToBottom("smooth", true));
      return;
    }

    requestAnimationFrame(() => revealLatestMessage("smooth"));
  }, [messages.length, reactionsSignature, revealLatestMessage, scrollToBottom]);

  return { showScrollButton, scrollToBottom };
}
