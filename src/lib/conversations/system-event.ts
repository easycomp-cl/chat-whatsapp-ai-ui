import type {
  SystemEvent,
  SystemEventActor,
  SystemEventAppearance,
  SystemEventKind,
} from "@/types/message";

const SYSTEM_EVENT_KINDS = new Set<SystemEventKind>([
  "profile_saved",
  "profile_updated",
  "handoff",
  "mode_changed",
  "plate_lookup",
  "vehicle_identified",
  "fitment_check",
  "recommendation",
  "suggestion",
  "quote_prepared",
  "mechanic_note",
]);

export const VEHICLE_SYSTEM_EVENT_KINDS = new Set<SystemEventKind>([
  "plate_lookup",
  "vehicle_identified",
  "fitment_check",
  "recommendation",
  "suggestion",
]);

export const PROFILE_SYSTEM_EVENT_KINDS = new Set<SystemEventKind>([
  "profile_saved",
  "profile_updated",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function parseKind(value: unknown): SystemEventKind | null {
  if (typeof value !== "string") return null;
  const kind = value.trim().toLowerCase() as SystemEventKind;
  return SYSTEM_EVENT_KINDS.has(kind) ? kind : null;
}

function parseActor(value: unknown): SystemEventActor {
  return value === "HUMAN" ? "HUMAN" : "BOT";
}

function payloadHasVehicleIdentity(payload: Record<string, unknown> | undefined): boolean {
  if (!payload) return false;
  const make = payload.make;
  const model = payload.model;
  return (
    (typeof make === "string" && make.trim().length > 0) ||
    (typeof model === "string" && model.trim().length > 0)
  );
}

export function resolveSystemEventAppearance(event: {
  kind: SystemEventKind;
  appearance?: SystemEventAppearance | string | null;
  payload?: Record<string, unknown>;
  title?: string;
}): SystemEventAppearance {
  if (event.appearance === "dark_card") return "dark_card";
  if (event.appearance === "blue_pill") return "blue_pill";
  if (event.payload?.appearance === "dark_card") return "dark_card";
  if (event.kind === "plate_lookup" && payloadHasVehicleIdentity(event.payload)) return "dark_card";
  if (/veh[ií]culo del contacto/i.test(event.title ?? "")) return "dark_card";
  return "blue_pill";
}

export function isSystemChatMessage(msg: {
  sender_type?: string | null;
  content_type?: string | null;
}): boolean {
  const sender = (msg.sender_type ?? "").toUpperCase();
  const type = (msg.content_type ?? "").toUpperCase();
  return sender === "SYSTEM" || type === "SYSTEM_EVENT";
}

export function parseSystemEvent(raw: unknown): SystemEvent | null {
  if (!raw) return null;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{")) {
      try {
        return parseSystemEvent(JSON.parse(trimmed));
      } catch {
        return systemEventFromContentText(trimmed);
      }
    }
    return systemEventFromContentText(trimmed);
  }

  const record = asRecord(raw);
  if (!record) return null;

  const nested = record.system_event ?? record.systemEvent;
  if (nested && nested !== raw) {
    const parsedNested = parseSystemEvent(nested);
    if (parsedNested) return parsedNested;
  }

  const kind = parseKind(record.kind);
  const title = readString(record, "title");
  const body = readString(record, "body");
  if (!kind && !title && !body) return null;

  const payload = asRecord(record.payload) ?? undefined;
  const kindResolved = kind ?? "mechanic_note";
  const titleResolved = title || body;
  const actor = parseActor(record.actor ?? payload?.actor);

  return {
    kind: kindResolved,
    actor,
    appearance: resolveSystemEventAppearance({
      kind: kindResolved,
      appearance: (record.appearance ?? payload?.appearance) as SystemEventAppearance | undefined,
      payload,
      title: titleResolved,
    }),
    title: titleResolved,
    body: title ? body : "",
    payload,
  };
}

function inferActor(title: string): SystemEventActor {
  return /asesor/i.test(title) ? "HUMAN" : "BOT";
}

function inferKind(title: string): SystemEventKind {
  const text = title.toLowerCase();
  if (text.includes("patente")) return "plate_lookup";
  if (text.includes("identific")) return "vehicle_identified";
  if (text.includes("cotizaci")) return "quote_prepared";
  if (text.includes("devolvi") || text.includes("modo")) return "mode_changed";
  if (text.includes("deriv") || text.includes("tomó") || text.includes("tomo la")) return "handoff";
  if (text.includes("sugir") || text.includes("recomend") || text.includes("compatib")) {
    return "recommendation";
  }
  if (text.includes("guardó") || text.includes("guardo") || text.includes("dato del contacto")) {
    return inferActor(title) === "HUMAN" ? "profile_updated" : "profile_saved";
  }
  return "mechanic_note";
}

export function systemEventFromContentText(text: string | null | undefined): SystemEvent | null {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return null;

  const separator = trimmed.indexOf(": ");
  const title = separator > 0 ? trimmed.slice(0, separator).trim() : trimmed;
  const body = separator > 0 ? trimmed.slice(separator + 2).trim() : "";

  const kind = inferKind(title);
  return {
    kind,
    actor: inferActor(title),
    appearance: resolveSystemEventAppearance({ kind, title }),
    title,
    body,
  };
}

export function resolveSystemEvent(message: {
  system_event?: SystemEvent | null;
  content_text?: string | null;
}): SystemEvent | null {
  if (message.system_event?.title || message.system_event?.body) {
    return {
      ...message.system_event,
      actor: message.system_event.actor === "HUMAN" ? "HUMAN" : "BOT",
      appearance: resolveSystemEventAppearance(message.system_event),
    };
  }
  return systemEventFromContentText(message.content_text);
}
