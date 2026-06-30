"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  loadNotificationSoundPrefs,
  setNotificationMuted,
  NOTIFICATION_PREFS_CHANGED,
  type NotificationSoundPrefs,
} from "@/lib/notifications/notification-sound-storage";

export function NotificationMuteButton() {
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function syncFromStorage() {
      setMuted(loadNotificationSoundPrefs().muted);
    }

    syncFromStorage();
    setReady(true);

    function onPrefsChanged(event: Event) {
      const detail = (event as CustomEvent<NotificationSoundPrefs>).detail;
      if (detail) setMuted(detail.muted);
      else syncFromStorage();
    }

    window.addEventListener(NOTIFICATION_PREFS_CHANGED, onPrefsChanged);
    return () => window.removeEventListener(NOTIFICATION_PREFS_CHANGED, onPrefsChanged);
  }, []);

  if (!ready) return null;

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setNotificationMuted(next);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleMute}
      title={muted ? "Activar sonidos de notificación" : "Silenciar notificaciones"}
      aria-label={muted ? "Activar sonidos de notificación" : "Silenciar notificaciones"}
    >
      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      <span className="sr-only">
        {muted ? "Activar sonidos" : "Silenciar"}
      </span>
    </Button>
  );
}
