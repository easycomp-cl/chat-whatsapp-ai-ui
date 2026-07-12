"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteConversationNoteAction,
  deleteConversationNotesAction,
} from "@/lib/actions/app-actions";
import { formatFullTime } from "@/lib/conversations/utils";
import type { ConversationNote } from "@/types/database.types";

type ContactNotesSectionProps = {
  conversationId: string;
  notes: ConversationNote[];
};

type DeleteTarget = { type: "all" } | { type: "one"; note: ConversationNote };

export function ContactNotesSection({
  conversationId,
  notes,
}: ContactNotesSectionProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirmDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      try {
        if (deleteTarget.type === "all") {
          await deleteConversationNotesAction(conversationId);
          toast.success("Notas del contacto eliminadas");
        } else {
          await deleteConversationNoteAction(conversationId, deleteTarget.note.id);
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
      <section className="rounded-xl border border-[#202022]/8 bg-white p-4 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#202022]/50">
            Notas del contacto
          </h4>
          {notes.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteTarget({ type: "all" })}
            >
              <Trash2 className="mr-1 size-3.5" />
              Borrar todas
            </Button>
          )}
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-[#202022]/40">Sin notas internas</p>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div
                key={n.id}
                className="group rounded-lg border border-dashed border-amber-200 bg-amber-50/70 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-[#202022]/80">{n.note}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-[#202022]/30 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    onClick={() => setDeleteTarget({ type: "one", note: n })}
                    aria-label="Borrar nota"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <p className="mt-1 text-[10px] text-amber-700/60">
                  {formatFullTime(n.created_at)}
                </p>
              </div>
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
                  Se eliminarán permanentemente las {notes.length} notas internas de este contacto.
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
            <p className="rounded-lg border border-dashed border-amber-200 bg-amber-50/70 p-3 text-sm text-[#202022]/80">
              {deleteTarget.note.note}
            </p>
          )}
          <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:justify-end">
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
