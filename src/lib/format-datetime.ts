const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "America/Santiago";

const HAS_TIMEZONE_SUFFIX = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

/**
 * Parsea timestamps de API/DB. Valores ISO sin offset se tratan como UTC
 * (evita que el navegador los interprete como hora local de Chile).
 */
export function parseAppDateTime(value: string | Date): Date {
  if (value instanceof Date) return value;

  const trimmed = value.trim();
  if (!trimmed) return new Date(Number.NaN);

  if (HAS_TIMEZONE_SUFFIX.test(trimmed)) {
    return new Date(trimmed);
  }

  const normalized = trimmed.includes(" ") ? trimmed.replace(" ", "T") : trimmed;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) {
    return new Date(`${normalized}Z`);
  }

  return new Date(trimmed);
}

/** Normaliza a ISO UTC para comparaciones y almacenamiento en estado. */
export function normalizeTimestampString(value: string | Date): string {
  return parseAppDateTime(value).toISOString();
}

function getDateKeyInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Clave YYYY-MM-DD en zona horaria de la app (agrupar métricas por día local). */
export function getDateKeyInAppTimezone(value: string | Date): string {
  return getDateKeyInTimezone(parseAppDateTime(value), APP_TIMEZONE);
}

export function isTodayInAppTimezone(date: Date): boolean {
  return (
    getDateKeyInTimezone(date, APP_TIMEZONE) ===
    getDateKeyInTimezone(new Date(), APP_TIMEZONE)
  );
}

export function isYesterdayInAppTimezone(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    getDateKeyInTimezone(date, APP_TIMEZONE) ===
    getDateKeyInTimezone(yesterday, APP_TIMEZONE)
  );
}

/** dd/MM/yyyy HH:mm */
export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parseAppDateTime(value));
}

/** HH:mm */
export function formatTime(value: string | Date) {
  const date = parseAppDateTime(value);
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** dd MMM yyyy, HH:mm */
export function formatFullDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parseAppDateTime(value));
}

/** dd/MM/yy */
export function formatShortDate(value: string | Date) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(parseAppDateTime(value));
}

/** dd/MM/yyyy */
export function formatDateOnly(value: string | Date) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseAppDateTime(value));
}

/** dd/MM HH:mm */
export function formatCompactDateTime(value: string | Date) {
  const date = parseAppDateTime(value);
  const dayMonth = new Intl.DateTimeFormat("es-CL", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  return `${dayMonth} ${formatTime(date)}`;
}

/** Etiqueta corta para gráficos a partir de clave YYYY-MM-DD. */
export function formatChartDayLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
  }).format(anchor);
}

/** "hace 5 minutos", "hace 2 horas", etc. */
export function formatRelativeFromNow(value: string | Date): string {
  const targetMs = parseAppDateTime(value).getTime();
  const diffSec = Math.round((targetMs - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat("es-CL", { numeric: "auto" });

  if (abs < 60) return rtf.format(Math.round(diffSec), "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(diffSec / 2592000), "month");
  return rtf.format(Math.round(diffSec / 31536000), "year");
}
