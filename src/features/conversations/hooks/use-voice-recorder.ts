"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUDIO_MAX_BYTES,
  VOICE_NOTE_MAX_DURATION_SEC,
} from "@/lib/conversations/message-media";

export type VoiceRecorderStatus = "idle" | "recording" | "recorded";

const MIME_CANDIDATES = [
  "audio/ogg;codecs=opus",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
] as const;

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? "";
}

function mimeToExtension(mimeType: string): string {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  return "webm";
}

export function useVoiceRecorder() {
  const [status, setStatus] = useState<VoiceRecorderStatus>("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mimeType = getSupportedMimeType();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const urlRef = useRef<string | null>(null);
  const stopRef = useRef<() => void>(() => {});

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    stopStream();
    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
    revokeUrl();
    setBlob(null);
    setUrl(null);
    setDurationSec(0);
    setError(null);
    setStatus("idle");
  }, [clearTimer, revokeUrl, stopStream]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
      revokeUrl();
    };
  }, [clearTimer, revokeUrl, stopStream]);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Tu navegador no soporta grabación de audio.");
      return;
    }
    if (!mimeType) {
      setError("Tu navegador no soporta el formato de audio requerido.");
      return;
    }

    reset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        clearTimer();
        stopStream();

        const recorded = new Blob(chunksRef.current, { type: mimeType });
        if (recorded.size === 0) {
          setError("No se capturó audio. Intenta de nuevo.");
          setStatus("idle");
          return;
        }
        if (recorded.size > AUDIO_MAX_BYTES) {
          setError("La nota de voz supera el límite de WhatsApp (16 MB).");
          setStatus("idle");
          return;
        }

        const objectUrl = URL.createObjectURL(recorded);
        urlRef.current = objectUrl;
        setBlob(recorded);
        setUrl(objectUrl);
        setStatus("recorded");
      };

      recorder.start(250);
      startedAtRef.current = Date.now();
      setStatus("recording");
      setDurationSec(0);
      timerRef.current = setInterval(() => {
        if (!startedAtRef.current) return;
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setDurationSec(elapsed);
        if (elapsed >= VOICE_NOTE_MAX_DURATION_SEC) {
          stopRef.current();
        }
      }, 250);
    } catch {
      stopStream();
      setError("No se pudo acceder al micrófono.");
      setStatus("idle");
    }
  }, [clearTimer, mimeType, reset, stopStream]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }, []);

  stopRef.current = stop;

  const filename = blob ? `nota-voz.${mimeToExtension(mimeType)}` : null;

  return {
    status,
    blob,
    url,
    durationSec,
    error,
    mimeType,
    filename,
    maxDurationSec: VOICE_NOTE_MAX_DURATION_SEC,
    canRecord: Boolean(mimeType),
    start,
    stop,
    reset,
  };
}

export function formatRecordingDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
