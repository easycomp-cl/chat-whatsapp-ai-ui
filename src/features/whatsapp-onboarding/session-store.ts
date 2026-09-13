import { STORAGE_PREFIX } from "@/lib/brand/constants";
import type { WhatsappConnectionView } from "./types";

const KEY = `${STORAGE_PREFIX}:whatsapp-embedded-signup`;

export function saveWhatsappSignupSnapshot(view: WhatsappConnectionView) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(view));
}

export function readWhatsappSignupSnapshot(): WhatsappConnectionView | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WhatsappConnectionView;
  } catch {
    return null;
  }
}

export function clearWhatsappSignupSnapshot() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
