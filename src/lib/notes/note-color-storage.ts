import { STORAGE_PREFIX } from "@/lib/brand/constants";
import {
  DEFAULT_NOTE_COLOR,
  isNotePastelColor,
  type NotePastelColorId,
} from "@/lib/notes/palette";

const NOTE_COLOR_STORAGE_KEY = `${STORAGE_PREFIX}:note-colors`;

type StoredNoteColors = Record<string, NotePastelColorId>;

function readStoredColors(): StoredNoteColors {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(NOTE_COLOR_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredNoteColors;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, color]) => isNotePastelColor(color))
    );
  } catch {
    return {};
  }
}

function writeStoredColors(colors: StoredNoteColors) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTE_COLOR_STORAGE_KEY, JSON.stringify(colors));
}

export function setStoredNoteColor(noteId: string, color: NotePastelColorId) {
  const colors = readStoredColors();
  colors[noteId] = color;
  writeStoredColors(colors);
}

export function removeStoredNoteColor(noteId: string) {
  const colors = readStoredColors();
  delete colors[noteId];
  writeStoredColors(colors);
}

export function resolveNoteColor(
  noteId: string,
  dbColor?: string | null
): NotePastelColorId {
  if (isNotePastelColor(dbColor)) return dbColor;
  const stored = readStoredColors()[noteId];
  return stored ?? DEFAULT_NOTE_COLOR;
}

export function mergeNotesWithStoredColors<
  T extends { id: string; color?: string | null },
>(notes: T[]): (T & { color: NotePastelColorId })[] {
  return notes.map((note) => ({
    ...note,
    color: resolveNoteColor(note.id, note.color),
  }));
}
