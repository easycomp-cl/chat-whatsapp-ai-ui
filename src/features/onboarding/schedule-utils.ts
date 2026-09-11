export const WEEKDAYS = [
  { key: "lun", short: "Lu", full: "Lunes" },
  { key: "mar", short: "Ma", full: "Martes" },
  { key: "mie", short: "Mi", full: "Miércoles" },
  { key: "jue", short: "Ju", full: "Jueves" },
  { key: "vie", short: "Vi", full: "Viernes" },
  { key: "sab", short: "Sa", full: "Sábado" },
  { key: "dom", short: "Do", full: "Domingo" },
] as const;

export type DayKey = (typeof WEEKDAYS)[number]["key"];

export type ScheduleBlock = {
  id: string;
  days: DayKey[];
  open: string;
  close: string;
};

export const WEEKDAY_KEYS: DayKey[] = ["lun", "mar", "mie", "jue", "vie"];
export const MINUTE_OPTIONS = ["00", "15", "30", "45"] as const;
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);

const DAY_BY_KEY = Object.fromEntries(WEEKDAYS.map((d) => [d.key, d])) as Record<
  DayKey,
  (typeof WEEKDAYS)[number]
>;

const DAY_BY_FULL = Object.fromEntries(
  WEEKDAYS.map((d) => [d.full.toLowerCase(), d.key])
);

export function normalizeTime(time: string): string {
  const [h, m] = time.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

export function snapMinute(minute: string): string {
  const n = Number(minute);
  if (Number.isNaN(n)) return "00";
  const snapped = Math.round(n / 15) * 15;
  return String(snapped === 60 ? 0 : snapped).padStart(2, "0");
}

export function parseTimeParts(time: string): { hour: string; minute: string } {
  const normalized = normalizeTime(time);
  const [hour, minute] = normalized.split(":");
  return { hour, minute: snapMinute(minute) };
}

export function joinTime(hour: string, minute: string): string {
  return `${hour.padStart(2, "0")}:${snapMinute(minute)}`;
}

export function parseDaysPart(part: string): DayKey[] {
  const raw = part.trim();
  const normalized = raw.toLowerCase().replace(/\s/g, "");

  if (/^lun[\u2013\-–]vie$/i.test(normalized)) {
    return [...WEEKDAY_KEYS];
  }

  const tokens = raw
    .split(/[,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const days: DayKey[] = [];
  for (const token of tokens) {
    const key = DAY_BY_FULL[token];
    if (key && !days.includes(key)) days.push(key);
  }

  return days;
}

export function formatDaysLabel(days: DayKey[]): string {
  const order = WEEKDAYS.map((d) => d.key);
  const sorted = [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b));

  const isWeekdays =
    sorted.length === 5 && sorted.every((d, i) => d === WEEKDAY_KEYS[i]);
  if (isWeekdays) return "Lun–Vie";

  if (sorted.length === 1) {
    return DAY_BY_KEY[sorted[0]].full;
  }

  return sorted.map((d) => DAY_BY_KEY[d].full).join(", ");
}

export function serializeScheduleBlocks(blocks: ScheduleBlock[]): string {
  return blocks
    .filter((b) => b.days.length > 0 && b.open && b.close)
    .map((b) => `${formatDaysLabel(b.days)} ${b.open}–${b.close}`)
    .join(" | ");
}

function parseScheduleSegment(segment: string): ScheduleBlock | null {
  const match = segment.trim().match(
    /^(.+)\s+(\d{1,2}:\d{2})\s*[\u2013\-–]\s*(\d{1,2}:\d{2})$/
  );
  if (!match) return null;

  const [, daysPart, open, close] = match;
  const days = parseDaysPart(daysPart);
  if (days.length === 0) return null;

  return {
    id: createBlockId(),
    days,
    open: normalizeTime(open),
    close: normalizeTime(close),
  };
}

/** Parser legacy: separa por comas solo cuando el tramo termina en HH:MM–HH:MM */
function splitLegacyScheduleSegments(value: string): string[] {
  const segments: string[] = [];
  let remaining = value.trim();

  while (remaining) {
    const match = remaining.match(
      /(.+)\s+(\d{1,2}:\d{2})\s*[\u2013\-–]\s*(\d{1,2}:\d{2})$/
    );
    if (!match) {
      if (remaining) segments.unshift(remaining);
      break;
    }
    segments.unshift(match[0].trim());
    remaining = remaining.slice(0, match.index).replace(/,\s*$/, "").trim();
  }

  return segments;
}

export function parseScheduleBlocks(value: string): ScheduleBlock[] {
  if (!value.trim()) return [];

  const rawSegments = value.includes("|")
    ? value.split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean)
    : splitLegacyScheduleSegments(value);

  const blocks = rawSegments
    .map((segment) => parseScheduleSegment(segment))
    .filter((block): block is ScheduleBlock => block !== null);

  return blocks.map((b, i) => ({ ...b, id: `block-${i}` }));
}

export function validateScheduleString(value: string): string | null {
  const blocks = parseScheduleBlocks(value);
  if (blocks.length === 0) {
    return "Agrega al menos un horario con un día seleccionado.";
  }

  for (const block of blocks) {
    if (block.days.length === 0) {
      return "Cada bloque de horario debe incluir al menos un día.";
    }
    if (block.open >= block.close) {
      return `En ${formatDaysLabel(block.days)}, la hora de cierre debe ser posterior a la de apertura.`;
    }
  }

  const assigned = new Set<DayKey>();
  for (const block of blocks) {
    for (const day of block.days) {
      if (assigned.has(day)) {
        return `${DAY_BY_KEY[day].full} está repetido en más de un horario.`;
      }
      assigned.add(day);
    }
  }

  return null;
}

export function createBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
