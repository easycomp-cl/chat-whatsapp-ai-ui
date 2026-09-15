export type SendMessageActionResult =
  | { ok: true; message: Record<string, unknown> | null }
  | { ok: false; error: string };

export function isRedactedServerError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("server components render") ||
    lower.includes("omitted in production") ||
    (lower.includes("digest") && lower.includes("error"))
  );
}

export function serializeActionJson(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  try {
    const parsed: unknown = JSON.parse(JSON.stringify(value));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isWhatsappSessionWindowError(message: string) {
  return /24\s*h|24-hour|customer care window|session window|fuera de la ventana|ventana de respuesta/i.test(
    message
  );
}

export function userFacingActionError(error: unknown, fallback: string): string {
  const message =
    error instanceof Error
      ? error.message.trim()
      : typeof error === "string"
        ? error.trim()
        : "";
  if (!message || isRedactedServerError(message)) return fallback;
  return message;
}
