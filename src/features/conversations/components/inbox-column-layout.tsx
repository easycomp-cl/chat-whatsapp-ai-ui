"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  INBOX_CHAT_MIN_WIDTH,
  INBOX_CONTACT_MAX_WIDTH,
  INBOX_CONTACT_MIN_WIDTH,
  INBOX_LIST_COMPACT_THRESHOLD,
  INBOX_LIST_MAX_WIDTH,
  INBOX_LIST_MIN_WIDTH,
  readInboxColumnLayoutPrefs,
  writeInboxColumnLayoutPrefs,
} from "@/lib/conversations/inbox-column-layout-storage";
import { InboxColumnLayoutProvider } from "@/features/conversations/context/inbox-column-layout-context";
import { ColumnResizeHandle } from "@/features/conversations/components/column-resize-handle";
import { ContactDetailsOverlay } from "@/features/conversations/components/contact-details-overlay";

const CONTACT_COLUMN_CLOSE_MS = 420;

type InboxColumnLayoutProps = {
  listPanel: React.ReactNode;
  chatPanel: React.ReactNode;
  contactPanel?: React.ReactNode;
};

function clampListWidth(width: number, containerWidth: number, contactWidth: number, contactVisible: boolean) {
  const contactSpace = contactVisible ? contactWidth + 8 : 0;
  const maxByContainer = containerWidth - INBOX_CHAT_MIN_WIDTH - contactSpace - 8;
  const max = Math.min(INBOX_LIST_MAX_WIDTH, Math.max(INBOX_LIST_MIN_WIDTH, maxByContainer));
  return Math.min(max, Math.max(INBOX_LIST_MIN_WIDTH, width));
}

function clampContactWidth(
  width: number,
  containerWidth: number,
  listWidth: number
) {
  const maxByContainer = containerWidth - listWidth - INBOX_CHAT_MIN_WIDTH - 16;
  const max = Math.min(INBOX_CONTACT_MAX_WIDTH, Math.max(INBOX_CONTACT_MIN_WIDTH, maxByContainer));
  return Math.min(max, Math.max(INBOX_CONTACT_MIN_WIDTH, width));
}

export function InboxColumnLayout({
  listPanel,
  chatPanel,
  contactPanel,
}: InboxColumnLayoutProps) {
  const isMobile = useIsMobile();
  const isXl = useMediaQuery("(min-width: 1280px)");
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  const [listWidth, setListWidth] = useState(INBOX_LIST_MIN_WIDTH);
  const [contactWidth, setContactWidth] = useState(INBOX_CONTACT_MIN_WIDTH);
  const [contactCollapsed, setContactCollapsed] = useState(false);
  const [contactOverlayOpen, setContactOverlayOpen] = useState(false);
  const [contactColumnMounted, setContactColumnMounted] = useState(false);
  const [contactColumnAnimating, setContactColumnAnimating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const contactPanelExists = Boolean(contactPanel);
  const isDesktop = !isMobile;
  const contactPanelAvailable = contactPanelExists && isXl;
  const contactColumnOpen = contactPanelAvailable && !contactCollapsed;
  const contactColumnRendered = contactPanelAvailable && contactColumnMounted;
  const contactColumnTakingSpace = contactColumnOpen;
  const isContactColumnClosing = contactColumnMounted && !contactColumnAnimating;
  const showContactOverlayTrigger = contactPanelExists && !isXl;
  const isListCompact =
    isDesktop && listWidth < INBOX_LIST_COMPACT_THRESHOLD;
  const isContactCompact = contactColumnAnimating && contactWidth < 240;

  useEffect(() => {
    const prefs = readInboxColumnLayoutPrefs();
    setListWidth(prefs.listWidth);
    setContactWidth(prefs.contactWidth);
    setContactCollapsed(prefs.contactCollapsed);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeInboxColumnLayoutPrefs({
      listWidth,
      contactWidth,
      contactCollapsed,
    });
  }, [hydrated, listWidth, contactWidth, contactCollapsed]);

  useEffect(() => {
    if (isXl && contactOverlayOpen) {
      setContactOverlayOpen(false);
    }
  }, [isXl, contactOverlayOpen]);

  useEffect(() => {
    setContactOverlayOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!contactPanelAvailable) {
      setContactColumnMounted(false);
      setContactColumnAnimating(false);
      return;
    }

    if (!contactCollapsed) {
      setContactColumnMounted(true);
      setContactColumnAnimating(true);
      return;
    }

    setContactColumnAnimating(false);
    const timeout = window.setTimeout(() => setContactColumnMounted(false), CONTACT_COLUMN_CLOSE_MS);
    return () => window.clearTimeout(timeout);
  }, [contactCollapsed, contactPanelAvailable]);

  const getContainerWidth = useCallback(() => {
    return containerRef.current?.clientWidth ?? window.innerWidth;
  }, []);

  const startListResize = useCallback(
    (event: React.MouseEvent) => {
      if (!isDesktop) return;
      event.preventDefault();

      const startX = event.clientX;
      const startWidth = listWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const containerWidth = getContainerWidth();
        setListWidth(
          clampListWidth(
            startWidth + delta,
            containerWidth,
            contactWidth,
            contactColumnTakingSpace
          )
        );
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [contactColumnTakingSpace, contactWidth, getContainerWidth, isDesktop, listWidth]
  );

  const startContactResize = useCallback(
    (event: React.MouseEvent) => {
      if (!contactColumnOpen) return;
      event.preventDefault();

      const startX = event.clientX;
      const startWidth = contactWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const containerWidth = getContainerWidth();
        setContactWidth(
          clampContactWidth(startWidth - delta, containerWidth, listWidth)
        );
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [contactColumnOpen, contactWidth, getContainerWidth, listWidth]
  );

  const toggleContactCollapsed = useCallback(() => {
    setContactCollapsed((prev) => !prev);
  }, []);

  const openContactOverlay = useCallback(() => {
    setContactOverlayOpen(true);
  }, []);

  const closeContactOverlay = useCallback(() => {
    setContactOverlayOpen(false);
  }, []);

  const contextValue = {
    isLayoutControlled: isDesktop,
    isListCompact,
    isContactCompact,
    contactCollapsed,
    contactPanelExists,
    contactPanelAvailable,
    contactOverlayOpen,
    showContactOverlayTrigger,
    showContactColumnReopen:
      contactPanelAvailable && contactCollapsed && !contactColumnMounted,
    openContactOverlay,
    closeContactOverlay,
    toggleContactCollapsed,
  };

  return (
    <InboxColumnLayoutProvider value={contextValue}>
      <div
        ref={containerRef}
        className="relative flex h-full min-h-0 overflow-hidden rounded-xl border border-[#202022]/8 bg-white shadow-[0_8px_40px_rgba(32,32,34,0.08)] md:rounded-2xl"
      >
        <div
          className={cn(
            "h-full min-h-0 shrink-0 overflow-hidden",
            !isDesktop && "w-[80px]",
            isDesktop && !hydrated && "w-[320px]"
          )}
          style={
            isDesktop && hydrated
              ? { width: listWidth, transition: "width 0ms" }
              : undefined
          }
        >
          {listPanel}
        </div>

        {isDesktop && (
          <ColumnResizeHandle onMouseDown={startListResize} />
        )}

        <div className="relative flex min-h-0 h-full min-w-0 flex-1 flex-col overflow-hidden">
          {chatPanel}

          {showContactOverlayTrigger && (
            <ContactDetailsOverlay
              open={contactOverlayOpen}
              onClose={closeContactOverlay}
            >
              {contactPanel}
            </ContactDetailsOverlay>
          )}
        </div>

        {contactColumnRendered && (
          <>
            {contactColumnOpen && (
              <ColumnResizeHandle onMouseDown={startContactResize} />
            )}
            <div
              className={cn(
                "h-full min-h-0 overflow-hidden bg-[#f9fafc]",
                isContactColumnClosing
                  ? "absolute top-0 right-0 z-20 animate-inbox-contact-slide-out shadow-[-8px_0_32px_rgba(32,32,34,0.12)]"
                  : "relative shrink-0",
                contactColumnAnimating && !isContactColumnClosing && "animate-inbox-contact-slide-in"
              )}
              style={{ width: contactWidth }}
            >
              {contactPanel}
            </div>
          </>
        )}
      </div>
    </InboxColumnLayoutProvider>
  );
}
