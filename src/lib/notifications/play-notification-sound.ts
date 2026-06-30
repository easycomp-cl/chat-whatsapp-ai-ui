import { getAlertToneById } from "@/lib/notifications/alert-tones";
import { loadNotificationSoundPrefs } from "@/lib/notifications/notification-sound-storage";

let audio: HTMLAudioElement | null = null;

export function playNotificationSound(toneId?: string) {
  if (typeof window === "undefined") return;

  const prefs = loadNotificationSoundPrefs();
  if (prefs.muted && toneId === undefined) return;

  const tone = getAlertToneById(toneId ?? prefs.toneId);

  if (!audio) {
    audio = new Audio();
  }

  audio.src = tone.src;
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // El navegador puede bloquear audio sin interacción previa del usuario.
  });
}
