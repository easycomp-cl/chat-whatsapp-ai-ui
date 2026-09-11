"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NoteColorPicker } from "@/features/conversations/components/note-color-picker";
import { addConversationNoteAction } from "@/lib/actions/app-actions";
import {
  DEFAULT_NOTE_COLOR,
  getNoteColorStyle,
  NOTE_MUTED_TEXT_COLOR,
  type NotePastelColorId,
} from "@/lib/notes/palette";
import { setStoredNoteColor } from "@/lib/notes/note-color-storage";

export function AddNoteForm({ conversationId }: { conversationId: string }) {
  const [note, setNote] = useState("");
  const [color, setColor] = useState<NotePastelColorId>(DEFAULT_NOTE_COLOR);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const palette = getNoteColorStyle(color);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await addConversationNoteAction(conversationId, { note, color });
        if (!result.colorPersisted) {
          setStoredNoteColor(result.id, color);
        }
        setNote("");
        router.refresh();
        toast.success("Nota agregada");
      } catch {
        toast.error("No se pudo agregar la nota");
      }
    });
  }

  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
      }}
    >
      <p
        className="mb-3 text-[11px] font-medium"
        style={{ color: NOTE_MUTED_TEXT_COLOR }}
      >
        Solo visible para tu equipo — no se envía por WhatsApp
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anota contexto, recordatorios o seguimiento interno..."
          rows={3}
          className="min-h-[80px] resize-none rounded-xl border-white/60 bg-white/55 font-medium text-[#452f26] placeholder:text-[#7a5f4a]/55 focus-visible:border-white focus-visible:ring-white/40"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <NoteColorPicker value={color} onChange={setColor} />
          <Button
            type="submit"
            size="sm"
            disabled={pending || !note.trim()}
            className="rounded-full border border-white/70 bg-white/75 font-medium text-[#452f26] shadow-sm hover:bg-white"
            variant="outline"
          >
            <Bookmark className="mr-1.5 size-3.5" />
            {pending ? "Guardando..." : "Guardar nota"}
          </Button>
        </div>
      </form>
    </div>
  );
}
