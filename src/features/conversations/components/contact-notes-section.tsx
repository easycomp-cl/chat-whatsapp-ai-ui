"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InternalNoteCard } from "@/features/conversations/components/internal-note-card";
import {
  deleteConversationNoteAction,
  deleteConversationNotesAction,
} from "@/lib/actions/app-actions";
import {
  mergeNotesWithStoredColors,
  removeStoredNoteColor,
} from "@/lib/notes/note-color-storage";
import type { ConversationNoteWithAuthor } from "@/types/database.types";

function sortNotesOldestFirst(notes: ConversationNoteWithAuthor[]) {
  return [...notes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

type ContactNotesSectionProps = {
  conversationId: string;
  notes: ConversationNoteWithAuthor[];
};

type DeleteTarget = { type: "all" } | { type: "one"; note: ConversationNoteWithAuthor };

export function ContactNotesSection({
  conversationId,
  notes,
}: ContactNotesSectionProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [pending, startTransition] = useTransition();
  const [resolvedNotes, setResolvedNotes] = useState(() =>
    sortNotesOldestFirst(mergeNotesWithStoredColors(notes))
  );

  useEffect(() => {
    setResolvedNotes(sortNotesOldestFirst(mergeNotesWithStoredColors(notes)));
  }, [notes]);

  function handleConfirmDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      try {
        if (deleteTarget.type === "all") {
          await deleteConversationNotesAction(conversationId);
          for (const note of resolvedNotes) {
            removeStoredNoteColor(note.id);
          }
          toast.success("Notas del contacto eliminadas");
        } else {
          await deleteConversationNoteAction(conversationId, deleteTarget.note.id);
          removeStoredNoteColor(deleteTarget.note.id);
          toast.success("Nota eliminada");
        }
        setDeleteTarget(null);
        router.refresh();
      } catch {
        toast.error(
          deleteTarget.type === "all"
            ? "No se pudieron eliminar las notas"
            : "No se pudo eliminar la nota"
        );
      }
    });
  }

  return (
    <>
      <section className="min-w-0 rounded-xl border border-[#202022]/8 bg-white p-4 shadow-sm">
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <h4 className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-[#202022]/50">
            Notas del contacto
          </h4>
          {notes.length > 1 && (
            <TooltipProvider delay={400}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget({ type: "all" })}
                      aria-label="Borrar todas"
                    />
                  }
                >
                  <Trash2 className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="top">Borrar todas</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {resolvedNotes.length === 0 ? (
          <p className="text-sm text-[#202022]/40">Sin notas internas</p>
        ) : (
          <div className="space-y-2.5">
            {resolvedNotes.map((note) => (
              <InternalNoteCard
                key={note.id}
                note={note.note}
                authorName={note.author_name}
                createdAt={note.created_at}
                color={note.color}
                onDelete={() => setDeleteTarget({ type: "one", note })}
              />
            ))}
          </div>
        )}
      </section>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>
              {deleteTarget?.type === "all" ? "¿Borrar todas las notas?" : "¿Borrar esta nota?"}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === "all" ? (
                <>
                  Se eliminarán permanentemente las {resolvedNotes.length} notas internas de este contacto.
                  Esta acción no se puede deshacer.
                </>
              ) : (
                <>
                  Se eliminará permanentemente esta nota interna. Esta acción no se puede deshacer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {deleteTarget?.type === "one" && (
            <InternalNoteCard
              note={deleteTarget.note.note}
              authorName={deleteTarget.note.author_name}
              createdAt={deleteTarget.note.created_at}
              color={deleteTarget.note.color}
            />
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={pending}
            >
              {pending ? "Eliminando…" : "Borrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
