export const INBOX_LIST_MIN_WIDTH = 80;
export const INBOX_LIST_MAX_WIDTH = 480;
export const INBOX_LIST_DEFAULT_WIDTH = 320;
export const INBOX_LIST_COMPACT_THRESHOLD = 160;

export const INBOX_CONTACT_MIN_WIDTH = 200;
export const INBOX_CONTACT_MAX_WIDTH = 480;
export const INBOX_CONTACT_DEFAULT_WIDTH = 300;

export const INBOX_CHAT_MIN_WIDTH = 280;

const STORAGE_KEY = "conversations-inbox-layout";

export type InboxColumnLayoutPrefs = {
  listWidth: number;
  contactWidth: number;
  contactCollapsed: boolean;
};

const DEFAULT_PREFS: InboxColumnLayoutPrefs = {
  listWidth: INBOX_LIST_DEFAULT_WIDTH,
  contactWidth: INBOX_CONTACT_DEFAULT_WIDTH,
  contactCollapsed: false,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function readInboxColumnLayoutPrefs(): InboxColumnLayoutPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;

    const parsed = JSON.parse(raw) as Partial<InboxColumnLayoutPrefs>;
    return {
      listWidth: clamp(
        parsed.listWidth ?? DEFAULT_PREFS.listWidth,
        INBOX_LIST_MIN_WIDTH,
        INBOX_LIST_MAX_WIDTH
      ),
      contactWidth: clamp(
        parsed.contactWidth ?? DEFAULT_PREFS.contactWidth,
        INBOX_CONTACT_MIN_WIDTH,
        INBOX_CONTACT_MAX_WIDTH
      ),
      contactCollapsed: parsed.contactCollapsed ?? DEFAULT_PREFS.contactCollapsed,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writeInboxColumnLayoutPrefs(prefs: InboxColumnLayoutPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
