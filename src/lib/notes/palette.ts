export const NOTE_PASTEL_COLORS = [
  { id: "mint", label: "Menta", bg: "#c8ebe0", border: "#a8dcd0" },
  { id: "peach", label: "Durazno", bg: "#f5d4c8", border: "#e8bfb0" },
  { id: "lemon", label: "Limón", bg: "#fce8b8", border: "#e5d4a8" },
  { id: "lavender", label: "Lavanda", bg: "#e4dcf5", border: "#cfc2eb" },
  { id: "sky", label: "Cielo", bg: "#cce8f4", border: "#b3dae8" },
  { id: "rose", label: "Rosa", bg: "#f5d0dc", border: "#e8b8c8" },
] as const;

export type NotePastelColorId = (typeof NOTE_PASTEL_COLORS)[number]["id"];

export const NOTE_TEXT_COLOR = "#452f26";
export const NOTE_MUTED_TEXT_COLOR = "#7a5f4a";
export const DEFAULT_NOTE_COLOR: NotePastelColorId = "lemon";

export function isNotePastelColor(value: string | null | undefined): value is NotePastelColorId {
  return NOTE_PASTEL_COLORS.some((color) => color.id === value);
}

export function getNoteColorStyle(color?: string | null) {
  return (
    NOTE_PASTEL_COLORS.find((entry) => entry.id === color) ??
    NOTE_PASTEL_COLORS.find((entry) => entry.id === DEFAULT_NOTE_COLOR)!
  );
}
