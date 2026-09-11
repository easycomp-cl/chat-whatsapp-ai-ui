"use client";

import { cn } from "@/lib/utils";
import {
  DEFAULT_NOTE_COLOR,
  NOTE_PASTEL_COLORS,
  type NotePastelColorId,
} from "@/lib/notes/palette";

type NoteColorPickerProps = {
  value: NotePastelColorId;
  onChange: (color: NotePastelColorId) => void;
  className?: string;
  size?: "sm" | "md";
};

export function NoteColorPicker({
  value,
  onChange,
  className,
  size = "md",
}: NoteColorPickerProps) {
  const dotSize = size === "sm" ? "size-4" : "size-5";

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      role="radiogroup"
      aria-label="Color de la nota"
    >
      {NOTE_PASTEL_COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          role="radio"
          aria-checked={value === color.id}
          aria-label={color.label}
          title={color.label}
          onClick={() => onChange(color.id)}
          className={cn(
            dotSize,
            "rounded-full border-2 transition-transform hover:scale-110",
            value === color.id
              ? "border-[#5c4033] ring-2 ring-[#5c4033]/15"
              : "border-white/80 shadow-sm"
          )}
          style={{ backgroundColor: color.bg }}
        />
      ))}
    </div>
  );
}

export function getDefaultNoteColor(): NotePastelColorId {
  return DEFAULT_NOTE_COLOR;
}
