"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONTACT_PANEL_CLOSE_MS = 420;

type ContactDetailsOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function ContactDetailsOverlay({
  open,
  onClose,
  children,
}: ContactDetailsOverlayProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    setVisible(false);
    const timeout = window.setTimeout(() => setMounted(false), CONTACT_PANEL_CLOSE_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-30 xl:hidden">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-[#202022]/20",
          visible ? "animate-inbox-contact-backdrop-in" : "animate-inbox-contact-backdrop-out"
        )}
        onClick={onClose}
        aria-label="Cerrar información del contacto"
      />
      <aside
        className={cn(
          "absolute inset-y-2 right-2 left-3 z-10 flex flex-col overflow-hidden rounded-2xl bg-[#f9fafc] shadow-[0_8px_40px_rgba(32,32,34,0.22)] ring-1 ring-[#202022]/8",
          visible ? "animate-inbox-contact-slide-in" : "animate-inbox-contact-slide-out"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Información del contacto"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#202022]/8 bg-white px-4 py-3">
          <h3 className="text-sm font-semibold text-[#202022]">Información del contacto</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[#202022]/50 hover:text-[#202022]"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </aside>
    </div>
  );
}
