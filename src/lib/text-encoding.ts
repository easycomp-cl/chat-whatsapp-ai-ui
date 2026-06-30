/**
 * Corrige texto UTF-8 mal interpretado como Latin-1 (ej. BarquÃ­n → Barquín)
 * y normaliza caracteres compuestos (ej. peña → peña).
 */
export function fixMojibake(text: string | null | undefined): string {
  if (!text) return "";

  let result = text;

  if (looksLikeMojibake(result)) {
    try {
      const bytes = Uint8Array.from(result, (char) => char.charCodeAt(0) & 0xff);
      result = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      // Mantener original si no es recuperable
    }
  }

  return result.normalize("NFC");
}

function looksLikeMojibake(text: string): boolean {
  return (
    /Ã[\u0080-\u00BF\u00A1-\u00BF]/.test(text) ||
    /[\u00C2-\u00C3][\u0080-\u00BF]/.test(text) ||
    /Ì[\u0080-\u00BF]/.test(text) ||
    text.includes("\uFFFD")
  );
}
