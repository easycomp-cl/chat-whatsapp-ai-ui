"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { editMessageAction } from "@/lib/actions/app-actions";
import { stripWhatsAppFormatting } from "@/lib/conversations/whatsapp-formatting";
import { WhatsAppFormattedText } from "@/features/conversations/components/whatsapp-formatted-text";
import type { Message } from "@/types/database.types";

type MessageEditableTextProps = {
  message: Message;
  conversationId: string;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  onEdited?: () => void;
};

export function MessageEditableText({
  message,
  conversationId,
  isEditing,
  onEditingChange,
  onEdited,
}: MessageEditableTextProps) {
  const plainText = stripWhatsAppFormatting(message.content_text ?? "");

  if (isEditing) {
    return (
      <MessageEditForm
        key={message.id}
        initialText={plainText}
        message={message}
        conversationId={conversationId}
        onCancel={() => onEditingChange(false)}
        onEdited={() => {
          onEditingChange(false);
          onEdited?.();
        }}
      />
    );
  }

  return (
    <p className="leading-relaxed whitespace-pre-wrap">
      <WhatsAppFormattedText text={message.content_text} />
    </p>
  );
}

function MessageEditForm({
  initialText,
  message,
  conversationId,
  onCancel,
  onEdited,
}: {
  initialText: string;
  message: Message;
  conversationId: string;
  onCancel: () => void;
  onEdited: () => void;
}) {
  const [draft, setDraft] = useState(initialText);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("Escribe un mensaje");
      return;
    }

    if (trimmed === initialText.trim()) {
      onCancel();
      return;
    }

    startTransition(async () => {
      try {
        await editMessageAction(message.id, conversationId, { text: trimmed });
        toast.success("Mensaje actualizado en WhatsApp");
        onEdited();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo editar el mensaje"
        );
      }
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        disabled={pending}
        className="min-h-[72px] resize-y border-[#00a884]/25 bg-white text-sm text-[#111b21]"
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
          className="h-7 px-2.5 text-xs"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={pending}
          className="h-7 bg-[#00a884] px-2.5 text-xs hover:bg-[#008f6f]"
        >
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
