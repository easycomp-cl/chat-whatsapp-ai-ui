export function normalizeRutStorage(value: string): string {
  const cleaned = value.replace(/[^\dkK]/gi, "").toUpperCase();
  if (cleaned.length < 2) return cleaned;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  return `${body}-${dv}`;
}

export function formatRutDisplay(value: string): string {
  const normalized = normalizeRutStorage(value);
  const match = normalized.match(/^(\d+)-([\dkK])$/);
  if (!match) return value;
  const digits = match[1];
  const dv = match[2];
  const padded = digits.padStart(8, "0");
  const withDots = padded.replace(/^(\d{1,2})(\d{3})(\d{3})$/, "$1.$2.$3");
  const formatted = `${withDots}-${dv}`;
  return formatted.startsWith("0") ? formatted.slice(1) : formatted;
}

export function isValidChileanRut(value: string): boolean {
  const normalized = normalizeRutStorage(value);
  const match = normalized.match(/^(\d+)-([\dkK])$/);
  if (!match) return false;
  const body = match[1];
  const dv = match[2];
  if (body.length < 7 || body.length > 8) return false;

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const mod = 11 - (sum % 11);
  const expected =
    mod === 11 ? "0" : mod === 10 ? "K" : String(mod);
  return expected === dv;
}
