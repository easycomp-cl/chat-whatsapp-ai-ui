import type { Message } from "@/types/database.types";
import type { StandardTemplateDefinition } from "./standard-pack";
import { fillTemplatePreview, templatePackDefinition } from "./utils";

export type TemplateCta = {
  label: string;
  hint: string;
  url: string | null;
};

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function inferStandardTemplateName(contentText?: string | null): string | null {
  const haystack = contentText?.toLowerCase() ?? "";
  if (!haystack) return null;
  if (/enlace de pago|link de pago|completa el pago/.test(haystack)) return "link_pago_es";
  if (/espera un humano|necesita un humano/.test(haystack)) return "aviso_handoff_es";
  if (/fuiste agregado al equipo|confirma que este n[uú]mero/.test(haystack)) {
    return "verificar_responsable_es";
  }
  return null;
}

function inferPaymentSuffix(contentText?: string | null): string | null {
  const match = contentText?.match(/pedido\s+#?([a-z0-9._-]+)/i);
  return match?.[1]?.replace(/[.,;:]+$/, "") ?? null;
}

function readNestedText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.text === "string" && record.text.trim()) return record.text.trim();
  return null;
}

export function extractTemplateButtonSuffix(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") {
    try {
      return extractTemplateButtonSuffix(JSON.parse(payload) as unknown);
    } catch {
      return payload.trim() || null;
    }
  }
  if (typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const direct = record.button_parameters ?? record.buttonParameters;
  if (Array.isArray(direct)) {
    const first = readNestedText(direct[0]);
    if (first) return first;
  }

  const nested =
    record.template ??
    record.outbound ??
    (record.outbound as Record<string, unknown> | undefined)?.template;
  if (nested && nested !== payload) {
    const fromNested = extractTemplateButtonSuffix(nested);
    if (fromNested) return fromNested;
  }

  const components = record.components ?? record.Components;
  if (!Array.isArray(components)) return null;

  for (const component of components) {
    if (!component || typeof component !== "object") continue;
    const item = component as Record<string, unknown>;
    const type = String(item.type ?? "").toLowerCase();
    if (type !== "button") continue;
    const parameters = item.parameters;
    if (!Array.isArray(parameters)) continue;
    const first = readNestedText(parameters[0]);
    if (first) return first;
  }

  return null;
}

export function resolveTemplateButtonUrl(
  pack: StandardTemplateDefinition | undefined,
  suffixOrUrl?: string | null
): string | null {
  const value = suffixOrUrl?.trim() ?? "";
  if (!value) return null;
  if (looksLikeUrl(value)) return value;
  if (!pack?.buttonUrlTemplate) return null;
  return fillTemplatePreview(pack.buttonUrlTemplate, [value]);
}

export function templateCtaFromPack(
  pack: StandardTemplateDefinition | undefined,
  suffixOrUrl?: string | null
): TemplateCta | null {
  if (!pack?.buttonLabel) return null;
  return {
    label: pack.buttonLabel,
    hint: pack.buttonHint ?? `Botón “${pack.buttonLabel}” de la plantilla`,
    url: resolveTemplateButtonUrl(pack, suffixOrUrl),
  };
}

export function exampleTemplateCta(pack: StandardTemplateDefinition): TemplateCta | null {
  return templateCtaFromPack(pack, pack.buttonParameter?.example ?? null);
}

export function resolveTemplateCta(input: {
  templateName?: string | null;
  contentText?: string | null;
  buttonUrl?: string | null;
  conversationId?: string | null;
}): TemplateCta | null {
  const name =
    input.templateName?.trim() || inferStandardTemplateName(input.contentText) || "";
  const pack = name ? templatePackDefinition(name) : undefined;
  if (!pack?.buttonLabel) return null;

  let suffix = input.buttonUrl?.trim() || null;
  if (!suffix && pack.name === "aviso_handoff_es" && input.conversationId) {
    suffix = input.conversationId;
  }
  if (!suffix && pack.name === "link_pago_es") {
    suffix = inferPaymentSuffix(input.contentText);
  }

  return templateCtaFromPack(pack, suffix);
}

export function resolveMessageTemplateCta(
  message: Pick<Message, "template_name" | "content_text" | "template_button_url" | "conversation_id">
): TemplateCta | null {
  return resolveTemplateCta({
    templateName: message.template_name,
    contentText: message.content_text,
    buttonUrl: message.template_button_url,
    conversationId: message.conversation_id,
  });
}
