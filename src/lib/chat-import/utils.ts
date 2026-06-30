/** Mismos patrones que el parser del backend (whatsapp-chat-parser.service.ts) */

import { fixMojibake } from "@/lib/text-encoding";

const INVISIBLE_CHARS = /[\u200E\u200F\uFEFF]/g;
const UNICODE_SPACES = /[\u202F\u00A0]/g;

/** Android: 12/05/2026, 10:42 - Nombre: mensaje */
export const WHATSAPP_HEADER_REGEX =
  /^(?:\[)?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?)\s*(?:\])?\s*[-–]\s*(.+?):\s(.*)$/i;

/** iOS / exportación reciente: [22-12-23, 20:25:45] Nombre: mensaje */
export const WHATSAPP_HEADER_BRACKET_REGEX =
  /^\[(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?)\]\s*(.+?):\s(.*)$/i;

const SYSTEM_MESSAGE_PATTERNS = [
  /messages and calls are end-to-end encrypted/i,
  /changed their phone number/i,
  /^[\s\u200E\u200F\uFEFF]*(?:image|sticker|video|audio|document|gif|contact card) omitted/i,
  /los mensajes y llamadas están cifrados/i,
  /los mensajes y las llamadas están cifrados/i,
  /se eliminó este mensaje/i,
  /se elimino este mensaje/i,
  /^[\s\u200E\u200F\uFEFF]*(?:imagen|sticker|video|audio|documento|gif|contacto).*(?:omitid[oa]|omitted)/i,
  /archivo adjunto/i,
  /cambió el código de seguridad/i,
  /cambio el codigo de seguridad/i,
  /creó el grupo/i,
  /creo el grupo/i,
  /añadió a/i,
  /anadio a/i,
  /salió del grupo/i,
  /salio del grupo/i,
  /<multimedia omitido>/i,
];

export type DetectedSender = {
  name: string;
  messageCount: number;
};

export function normalizeWhatsAppLine(line: string): string {
  return line
    .trimEnd()
    .replace(INVISIBLE_CHARS, "")
    .replace(UNICODE_SPACES, " ");
}

function cleanMessageText(text: string): string {
  return text
    .replace(INVISIBLE_CHARS, "")
    .replace(UNICODE_SPACES, " ")
    .replace(
      /\s*(?:imagen|audio|video|sticker|documento|gif) omitid[oa]\s*$/i,
      ""
    )
    .trim();
}

export function isSystemMessage(text: string): boolean {
  return SYSTEM_MESSAGE_PATTERNS.some((pattern) => pattern.test(text));
}

export function parseWhatsAppHeader(
  line: string
): { sender: string; message: string } | null {
  const normalized = normalizeWhatsAppLine(line);
  const match =
    normalized.match(WHATSAPP_HEADER_REGEX) ??
    normalized.match(WHATSAPP_HEADER_BRACKET_REGEX);
  if (!match) return null;

  const sender = match[3];
  const message = match[4];
  if (!sender || message === undefined) return null;

  const trimmedMessage = cleanMessageText(message);
  if (!trimmedMessage || isSystemMessage(trimmedMessage)) return null;

  return { sender: fixMojibake(sender.trim()), message: trimmedMessage };
}

export function isParseableWhatsAppLine(line: string): boolean {
  return parseWhatsAppHeader(line) !== null;
}

export function extractSendersFromContent(content: string): DetectedSender[] {
  const counts = new Map<string, number>();

  for (const rawLine of content.replace(/\r\n/g, "\n").split("\n")) {
    const parsed = parseWhatsAppHeader(rawLine);
    if (!parsed) continue;
    counts.set(parsed.sender, (counts.get(parsed.sender) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, messageCount]) => ({ name, messageCount }))
    .sort((a, b) => b.messageCount - a.messageCount);
}

export async function extractSendersFromFile(file: File): Promise<DetectedSender[]> {
  if (!file.name.toLowerCase().endsWith(".txt")) return [];
  const content = await file.text();
  return extractSendersFromContent(content);
}

export const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024;

export const ACCEPTED_CHAT_EXTENSIONS = [".txt", ".zip"];

export function validateChatFile(file: File): string | null {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!ACCEPTED_CHAT_EXTENSIONS.includes(ext)) {
    return "Solo se permiten archivos .txt o .zip";
  }
  if (file.size === 0) {
    return "El archivo no puede estar vacío";
  }
  if (file.size > MAX_CHAT_FILE_SIZE) {
    return "El archivo no puede superar 10 MB";
  }
  return null;
}

export function hasPlaceholder(text: string): boolean {
  return /\$____|____/.test(text);
}

export async function validateWhatsAppFormat(file: File): Promise<string | null> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".zip") || !lower.endsWith(".txt")) return null;

  const senders = await extractSendersFromFile(file);
  if (senders.length === 0) {
    return "No se detectó el formato de exportación de WhatsApp. Exporta el chat desde la app y sube el .txt sin modificarlo.";
  }
  return null;
}

export function isParseError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /parseables|vac[ií]o|\.txt v[aá]lido/i.test(message);
}

export const EMOJI_USAGE_LABELS: Record<string, string> = {
  none: "Sin emojis",
  low: "Pocos",
  moderate: "Moderado",
  high: "Muchos",
};

export const RESPONSE_LENGTH_LABELS: Record<string, string> = {
  short: "Breve",
  medium: "Medio",
  long: "Largo",
};

export const FORMALITY_LABELS: Record<string, string> = {
  informal: "Informal",
  semi_formal: "Semi formal",
  formal: "Formal",
};

export const FAQ_STATUS_LABELS: Record<string, string> = {
  pending_review: "Pendiente",
  edited: "Editada",
  approved: "Aprobada",
  rejected: "Rechazada",
  archived: "Archivada",
};

export const TONE_STATUS_LABELS: Record<string, string> = {
  pending_review: "Pendiente de revisión",
  approved: "Aplicado al bot",
  rejected: "Rechazado",
};

export const JOB_STATUS_MESSAGES: Record<string, string> = {
  pending: "Preparando análisis…",
  processing: "Analizando conversaciones…",
  completed: "Análisis completado",
  failed: "Error en el análisis",
};
