"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALERT_TONES } from "@/lib/notifications/alert-tones";
import { playNotificationSound } from "@/lib/notifications/play-notification-sound";
import {
  loadNotificationSoundPrefs,
  saveNotificationSoundPrefs,
  NOTIFICATION_PREFS_CHANGED,
  type NotificationSoundPrefs,
} from "@/lib/notifications/notification-sound-storage";

export function NotificationSoundSettings() {
  const [prefs, setPrefs] = useState<NotificationSoundPrefs | null>(null);

  useEffect(() => {
    function syncFromStorage() {
      setPrefs(loadNotificationSoundPrefs());
    }

    syncFromStorage();

    function onPrefsChanged(event: Event) {
      const detail = (event as CustomEvent<NotificationSoundPrefs>).detail;
      if (detail) setPrefs(detail);
      else syncFromStorage();
    }

    window.addEventListener(NOTIFICATION_PREFS_CHANGED, onPrefsChanged);
    return () => window.removeEventListener(NOTIFICATION_PREFS_CHANGED, onPrefsChanged);
  }, []);

  function updatePrefs(next: NotificationSoundPrefs) {
    setPrefs(next);
    saveNotificationSoundPrefs(next);
  }

  if (!prefs) {
    return <p className="text-sm text-muted-foreground">Cargando preferencias…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {prefs.muted ? (
              <VolumeX className="size-4 text-muted-foreground" />
            ) : (
              <Volume2 className="size-4 text-muted-foreground" />
            )}
            <Label htmlFor="notification-muted">Silenciar notificaciones</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Cuando está activo, no se reproducirá ningún sonido al recibir mensajes nuevos.
          </p>
        </div>
        <Switch
          id="notification-muted"
          checked={prefs.muted}
          onCheckedChange={(muted) => updatePrefs({ ...prefs, muted })}
        />
      </div>

      <div className="space-y-3">
        <Label>Tono de notificación</Label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={prefs.toneId}
            onValueChange={(toneId) => {
              if (!toneId) return;
              updatePrefs({ ...prefs, toneId });
            }}
            disabled={prefs.muted}
          >
            <SelectTrigger className="sm:max-w-xs">
              <SelectValue placeholder="Selecciona un tono" />
            </SelectTrigger>
            <SelectContent>
              {ALERT_TONES.map((tone) => (
                <SelectItem key={tone.id} value={tone.id}>
                  {tone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            disabled={prefs.muted}
            onClick={() => playNotificationSound(prefs.toneId)}
          >
            Probar tono
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Se reproduce cuando llega un mensaje nuevo de un cliente en otra conversación.
          Las preferencias se guardan en este navegador.
        </p>
      </div>
    </div>
  );
}
