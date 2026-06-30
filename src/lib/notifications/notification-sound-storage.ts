import { DEFAULT_ALERT_TONE_ID } from "@/lib/notifications/alert-tones";

const STORAGE_KEY = "easycomp-notification-sound";
export const NOTIFICATION_PREFS_CHANGED = "easycomp-notification-prefs-changed";

export type NotificationSoundPrefs = {
  muted: boolean;
  toneId: string;
};

const DEFAULT_PREFS: NotificationSoundPrefs = {
  muted: false,
  toneId: DEFAULT_ALERT_TONE_ID,
};

export function loadNotificationSoundPrefs(): NotificationSoundPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationSoundPrefs>;
    return {
      muted: Boolean(parsed.muted),
      toneId: parsed.toneId ?? DEFAULT_ALERT_TONE_ID,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveNotificationSoundPrefs(prefs: NotificationSoundPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFS_CHANGED, { detail: prefs }));
}

export function setNotificationMuted(muted: boolean) {
  const prefs = loadNotificationSoundPrefs();
  saveNotificationSoundPrefs({ ...prefs, muted });
}

export function setNotificationToneId(toneId: string) {
  const prefs = loadNotificationSoundPrefs();
  saveNotificationSoundPrefs({ ...prefs, toneId });
}
