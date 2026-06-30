import type { CreateFaqBody } from "@/lib/bot-api/types";

const HEADER_ALIASES: Record<keyof Omit<CreateFaqBody, "alternate_phrases" | "keywords">, string[]> = {
  question: ["question", "pregunta"],
  answer: ["answer", "respuesta"],
  category: ["category", "categoria"],
  priority: ["priority", "prioridad"],
  active: ["active", "activa", "activo"],
};

const LIST_ALIASES = {
  alternate_phrases: [
    "alternate_phrases",
    "alternate phrases",
    "frases_alternativas",
    "frases alternativas",
  ],
  keywords: ["keywords", "palabras_clave", "palabras clave", "keyword"],
} as const;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function pickField(row: Record<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];
    if (value !== undefined && value !== "") return value;
  }
  return undefined;
}

function parseListField(value?: string): string[] {
  if (!value?.trim()) return [];

  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fallback to delimiter split
    }
  }

  return trimmed
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value?: string): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "si", "sí", "yes", "activa", "activo"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "inactiva", "inactivo"].includes(normalized)) {
    return false;
  }
  return undefined;
}

function rowToFaq(row: Record<string, string>): CreateFaqBody | null {
  const question = pickField(row, HEADER_ALIASES.question);
  const answer = pickField(row, HEADER_ALIASES.answer);
  if (!question || !answer) return null;

  const priorityRaw = pickField(row, HEADER_ALIASES.priority);
  const activeRaw = pickField(row, HEADER_ALIASES.active);

  return {
    question,
    answer,
    category: pickField(row, HEADER_ALIASES.category),
    priority: priorityRaw ? Number(priorityRaw) : undefined,
    active: parseBoolean(activeRaw),
    alternate_phrases: parseListField(
      pickField(row, [...LIST_ALIASES.alternate_phrases])
    ),
    keywords: parseListField(pickField(row, [...LIST_ALIASES.keywords])),
  };
}

function objectToFaq(item: Record<string, unknown>): CreateFaqBody | null {
  const question = item.question ?? item.pregunta;
  const answer = item.answer ?? item.respuesta;
  if (!question || !answer) return null;

  const toList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry).trim()).filter(Boolean);
    }
    if (typeof value === "string") return parseListField(value);
    return [];
  };

  const activeValue = item.active ?? item.activa ?? item.activo;

  return {
    question: String(question),
    answer: String(answer),
    category: item.category != null ? String(item.category) : item.categoria != null ? String(item.categoria) : undefined,
    priority:
      item.priority != null
        ? Number(item.priority)
        : item.prioridad != null
          ? Number(item.prioridad)
          : undefined,
    active:
      typeof activeValue === "boolean"
        ? activeValue
        : typeof activeValue === "string"
          ? parseBoolean(activeValue)
          : undefined,
    alternate_phrases: toList(
      item.alternate_phrases ?? item.alternatePhrases ?? item.frases_alternativas
    ),
    keywords: toList(item.keywords ?? item.palabras_clave),
  };
}

export function parseCsvFaqs(csvText: string): CreateFaqBody[] {
  const lines = csvText.trim().split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const faqs: CreateFaqBody[] = [];

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? "";
    });

    const faq = rowToFaq(row);
    if (faq) faqs.push(faq);
  }

  return faqs;
}

export function parseJsonFaqs(jsonText: string): CreateFaqBody[] {
  const parsed = JSON.parse(jsonText) as unknown;
  const items = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null
      ? ((parsed as { faqs?: unknown[]; items?: unknown[] }).faqs ??
        (parsed as { items?: unknown[] }).items ??
        [])
      : [];

  if (!Array.isArray(items)) {
    throw new Error("El JSON debe ser un array o un objeto con clave faqs");
  }

  return items
    .map((item) =>
      typeof item === "object" && item !== null
        ? objectToFaq(item as Record<string, unknown>)
        : null
    )
    .filter((faq): faq is CreateFaqBody => faq !== null);
}
