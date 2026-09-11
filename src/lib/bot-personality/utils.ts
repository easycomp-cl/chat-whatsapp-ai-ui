import type { BotPersonality } from "@/lib/bot-api/types";

export const MAX_VARIANTS_PER_TRIGGER = 20;
export const MAX_RESPONSE_TEXT_LENGTH = 500;

export const PREVIEW_SAMPLE = {
  nombre: "Camila",
  saludo: "Holaaa",
};

export function substitutePlaceholders(
  text: string,
  ctx: {
    businessName: string;
    botName: string;
    greetingMessage?: string;
    fallbackMessage?: string;
    toneGreetings?: BotPersonality["tone_greetings"];
  }
): string {
  const saludo =
    ctx.toneGreetings?.[0]?.text ??
    ctx.greetingMessage?.split(/[,.!]/)[0]?.trim() ??
    PREVIEW_SAMPLE.saludo;

  return text
    .replaceAll("{nombre}", PREVIEW_SAMPLE.nombre)
    .replaceAll("{negocio}", ctx.businessName)
    .replaceAll("{bot}", ctx.botName || "Bot")
    .replaceAll("{saludo}", saludo);
}

export function validateVariantText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "El texto no puede estar vacío";
  if (trimmed.length > MAX_RESPONSE_TEXT_LENGTH) {
    return `Máximo ${MAX_RESPONSE_TEXT_LENGTH} caracteres`;
  }
  return null;
}

export function validateVariantsCount(count: number): string | null {
  if (count > MAX_VARIANTS_PER_TRIGGER) {
    return `Máximo ${MAX_VARIANTS_PER_TRIGGER} variantes por situación`;
  }
  return null;
}
