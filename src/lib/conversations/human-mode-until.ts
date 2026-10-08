const COUNTDOWN_INTERVAL_MS = 30_000;

export const HUMAN_MODE_COUNTDOWN_INTERVAL_MS = COUNTDOWN_INTERVAL_MS;

export const BOT_MODE_RESUMED_FALLBACK =
  "Volvió a modo BOT (30 min sin respuesta)";

function normalizeUntilField(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Lee `human_mode_until` (snake o camel). `undefined` si el campo no viene. */
export function readHumanModeUntil(raw: unknown): string | null | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const record = raw as Record<string, unknown>;
  if ("human_mode_until" in record) return normalizeUntilField(record.human_mode_until);
  if ("humanModeUntil" in record) return normalizeUntilField(record.humanModeUntil);
  return undefined;
}

export function parseHumanModeUntilMs(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const ms = Date.parse(trimmed);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * ISO futuro solo si la conversación está en HUMAN y la fecha es válida y posterior a ahora.
 * Si el campo falta, es null o ya pasó, no hay contador.
 */
export function getFutureHumanModeUntilIso(
  mode: string | null | undefined,
  until: unknown
): string | null {
  if (mode !== "HUMAN") return null;
  const ms = parseHumanModeUntilMs(until);
  if (ms == null || ms <= Date.now()) return null;
  return typeof until === "string" ? until.trim() : null;
}

export function formatBotResumeCountdown(remainingMs: number): string | null {
  if (remainingMs <= 0) return null;
  if (remainingMs < 60_000) return "Vuelve a BOT en menos de 1 min";
  return `Vuelve a BOT en ${Math.ceil(remainingMs / 60_000)} min`;
}

export function withHumanModeUntil<T extends { human_mode_until?: string | null }>(
  conversation: T
): T {
  const until = readHumanModeUntil(conversation);
  if (until === undefined) return conversation;
  if (conversation.human_mode_until === until) return conversation;
  return { ...conversation, human_mode_until: until };
}
