const STORAGE_KEY = "easycomp-conv-last-read";

export function loadLastReadMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function getLastReadAt(conversationId: string): string | undefined {
  return loadLastReadMap()[conversationId];
}

export function saveLastReadMap(data: Record<string, string>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export { findFirstPendingActivity as findFirstPendingMessage } from "@/lib/conversations/pending-activity";
