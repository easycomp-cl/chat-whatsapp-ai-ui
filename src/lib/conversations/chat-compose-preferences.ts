const STORAGE_PREFIX = "easycomp-chat-compose";

export const CHAT_COMPOSE_PREFS_CHANGED = "easycomp-chat-compose-prefs-changed";

export type ChatComposePrefs = {
  enterToSend: boolean;
};

const DEFAULT_PREFS: ChatComposePrefs = {
  enterToSend: false,
};

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function loadChatComposePrefs(userId: string): ChatComposePrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ChatComposePrefs>;
    return {
      enterToSend: Boolean(parsed.enterToSend),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveChatComposePrefs(userId: string, prefs: ChatComposePrefs) {
  localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
  window.dispatchEvent(
    new CustomEvent(CHAT_COMPOSE_PREFS_CHANGED, {
      detail: { userId, ...prefs },
    })
  );
}

export function setEnterToSendPref(userId: string, enterToSend: boolean) {
  saveChatComposePrefs(userId, { enterToSend });
}
