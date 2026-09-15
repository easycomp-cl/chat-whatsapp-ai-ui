const STORAGE_KEY = "easycomp-conv-last-read";

function readStore(storage: Storage): Record<string, string> | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function loadLastReadMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const fromLocal = readStore(localStorage);
    if (fromLocal) return fromLocal;
    const fromSession = readStore(sessionStorage);
    if (fromSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fromSession));
      return fromSession;
    }
    return {};
  } catch {
    return {};
  }
}

export function getLastReadAt(conversationId: string): string | undefined {
  return loadLastReadMap()[conversationId];
}

export function saveLastReadMap(data: Record<string, string>) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(data);
  try {
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    /* ignore quota / private mode */
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, payload);
  } catch {
    /* ignore quota / private mode */
  }
}

export { findFirstPendingActivity as findFirstPendingMessage } from "@/lib/conversations/pending-activity";
