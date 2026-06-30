"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addConversationNoteAction } from "@/lib/actions/app-actions";

export function AddNoteForm({ conversationId }: { conversationId: string }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await addConversationNoteAction(conversationId, { note });
        setNote("");
        toast.success("Nota agregada");
      } catch {
        toast.error("No se pudo agregar la nota");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Anota contexto, recordatorios o seguimiento interno..."
        rows={3}
        className="min-h-[80px] resize-none rounded-xl border-amber-200 bg-amber-50/80 text-[#202022] placeholder:text-amber-700/40 focus-visible:border-amber-300 focus-visible:ring-amber-200/50"
      />
      <Button
        type="submit"
        size="sm"
        disabled={pending || !note.trim()}
        className="rounded-full border border-amber-300 bg-amber-100 text-amber-900 shadow-sm hover:bg-amber-200"
        variant="outline"
      >
        <Bookmark className="mr-1.5 size-3.5" />
        {pending ? "Guardando..." : "Guardar nota interna"}
      </Button>
    </form>
  );
}
