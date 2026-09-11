"use client";

import { Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StickyNoteFrame } from "@/features/conversations/components/sticky-note-frame";
import { formatShortDate } from "@/lib/format-datetime";
import { NOTE_MUTED_TEXT_COLOR, NOTE_TEXT_COLOR } from "@/lib/notes/palette";
import { cn } from "@/lib/utils";

type InternalNoteCardProps = {
  note: string;
  authorName?: string | null;
  createdAt: string;
  color?: string | null;
  className?: string;
  onDelete?: () => void;
};

export function InternalNoteCard({
  note,
  authorName,
  createdAt,
  color,
  className,
  onDelete,
}: InternalNoteCardProps) {
  return (
    <StickyNoteFrame color={color} className={className} contentClassName="px-3 py-2">
      <article className="group relative">
        <div className="flex items-start gap-1.5">
          <p
            className="min-w-0 flex-1 whitespace-pre-wrap text-sm font-medium leading-snug"
            style={{ color: NOTE_TEXT_COLOR }}
          >
            {note}
          </p>
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 opacity-0 transition-opacity hover:bg-black/5 hover:text-destructive group-hover:opacity-100"
              style={{ color: `${NOTE_MUTED_TEXT_COLOR}99` }}
              onClick={onDelete}
              aria-label="Borrar nota"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>

        <footer
          className={cn("mt-1.5 flex min-w-0 items-center gap-1 text-[10px]")}
          style={{ color: NOTE_MUTED_TEXT_COLOR }}
        >
          <UserRound className="size-2.5 shrink-0" aria-hidden />
          <span className="truncate">
            {authorName?.trim() || "Usuario"}
            <span className="mx-1 opacity-60">·</span>
            {formatShortDate(createdAt)}
          </span>
        </footer>
      </article>
    </StickyNoteFrame>
  );
}
