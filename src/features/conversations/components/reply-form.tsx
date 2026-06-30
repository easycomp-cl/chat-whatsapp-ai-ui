"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendConversationReplyAction } from "@/lib/actions/app-actions";
import { getReplyPreviewText } from "@/lib/conversations/message-display";
import type { Message } from "@/types/database.types";

type ReplyFormProps = {
  conversationId: string;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  onSent?: (text: string, serverMessage?: Record<string, unknown> | null) => void;
};

export function ReplyForm({
  conversationId,
  replyingTo,
  onCancelReply,
  onSent,
}: ReplyFormProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    const text = String(formData.get("text") ?? "").trim();
    if (!text) {
      toast.error("Escribe un mensaje");
      return;
    }

    onSent?.(text, null);

    startTransition(async () => {
      try {
        const created = await sendConversationReplyAction(conversationId, {
          text,
          ...(replyingTo ? { reply_to_message_id: replyingTo.id } : {}),
        });
        toast.success(
          replyingTo ? "Respuesta citada enviada por WhatsApp" : "Mensaje enviado por WhatsApp"
        );
        formRef.current?.reset();
        onCancelReply?.();
        onSent?.(text, created);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "No se pudo enviar el mensaje";
        toast.error(message);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit}>
      {replyingTo && (
        <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border-l-[3px] border-[#00a884] bg-white/80 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#00a884]">Respondiendo a</p>
            <p className="line-clamp-2 text-xs text-[#667781]">
              {getReplyPreviewText(replyingTo)}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 rounded-full p-1 text-[#667781] hover:bg-[#f0f2f5]"
            aria-label="Cancelar cita"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <Textarea
        name="text"
        key={replyingTo?.id ?? "plain"}
        placeholder={
          replyingTo
            ? "Escribe tu respuesta citada..."
            : "Escribe tu respuesta al cliente..."
        }
        className="min-h-[80px] resize-none rounded-xl border-[#7678ed]/20 bg-white text-[#202022] placeholder:text-[#202022]/35 focus-visible:border-[#7678ed]/50 focus-visible:ring-[#7678ed]/20"
        disabled={pending}
      />
      <Button
        type="submit"
        disabled={pending}
        className="mt-2.5 rounded-full bg-[#7678ed] px-5 shadow-md shadow-[#7678ed]/25 hover:bg-[#6567d8]"
      >
        <Send className="mr-1.5 size-3.5" />
        {pending ? "Enviando..." : replyingTo ? "Enviar respuesta citada" : "Enviar por WhatsApp"}
      </Button>
    </form>
  );
}
