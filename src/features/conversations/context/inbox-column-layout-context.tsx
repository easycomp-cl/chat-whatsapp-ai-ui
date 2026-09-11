"use client";

import { createContext, useContext } from "react";

export type InboxColumnLayoutContextValue = {
  isLayoutControlled: boolean;
  isListCompact: boolean;
  isContactCompact: boolean;
  contactCollapsed: boolean;
  contactPanelExists: boolean;
  contactPanelAvailable: boolean;
  contactOverlayOpen: boolean;
  showContactOverlayTrigger: boolean;
  showContactColumnReopen: boolean;
  openContactOverlay: () => void;
  closeContactOverlay: () => void;
  toggleContactCollapsed: () => void;
};

const InboxColumnLayoutContext = createContext<InboxColumnLayoutContextValue>({
  isLayoutControlled: false,
  isListCompact: false,
  isContactCompact: false,
  contactCollapsed: false,
  contactPanelExists: false,
  contactPanelAvailable: false,
  contactOverlayOpen: false,
  showContactOverlayTrigger: false,
  showContactColumnReopen: false,
  openContactOverlay: () => {},
  closeContactOverlay: () => {},
  toggleContactCollapsed: () => {},
});

export function InboxColumnLayoutProvider({
  value,
  children,
}: {
  value: InboxColumnLayoutContextValue;
  children: React.ReactNode;
}) {
  return (
    <InboxColumnLayoutContext.Provider value={value}>
      {children}
    </InboxColumnLayoutContext.Provider>
  );
}

export function useInboxColumnLayoutContext() {
  return useContext(InboxColumnLayoutContext);
}
