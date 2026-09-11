const graphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("es", { granularity: "grapheme" })
    : null;

export function splitGraphemes(value: string): string[] {
  if (!value) return [];
  if (graphemeSegmenter) {
    return [...graphemeSegmenter.segment(value)].map((part) => part.segment);
  }
  return Array.from(value);
}

export function truncateGraphemes(value: string, maxGraphemes: number): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const segments = splitGraphemes(trimmed);
  if (segments.length <= maxGraphemes) return trimmed;
  return `${segments.slice(0, maxGraphemes).join("")}…`;
}

function firstLetterGrapheme(word: string): string | null {
  for (const grapheme of splitGraphemes(word)) {
    if (/[\p{L}\p{N}]/u.test(grapheme)) {
      return grapheme;
    }
  }
  return null;
}

export function getAvatarInitials(
  name: string | null | undefined,
  phone?: string
): string {
  const trimmed = name?.trim();
  if (trimmed) {
    const words = trimmed.split(/\s+/).filter(Boolean);
    const initials: string[] = [];

    for (const word of words) {
      const letter = firstLetterGrapheme(word);
      if (!letter) continue;
      initials.push(letter.toLocaleUpperCase("es-CL"));
      if (initials.length >= 2) break;
    }

    if (initials.length > 0) return initials.join("");

    const firstGrapheme = splitGraphemes(trimmed).find((part) => part.trim());
    if (firstGrapheme) return firstGrapheme;

    return "?";
  }

  return phone?.slice(-2) ?? "?";
}

export function getShortDisplayName(name: string, maxGraphemes = 14): string {
  const firstWord = name.trim().split(/\s+/)[0] ?? name;
  return truncateGraphemes(firstWord, maxGraphemes);
}
