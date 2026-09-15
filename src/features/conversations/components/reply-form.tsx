"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleHelp, Mic, Send, Square, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { userFacingActionError, isWhatsappSessionWindowError } from "@/lib/actions/action-result";
import {
  sendConversationInteractiveAction,
  sendConversationMediaAction,
  sendConversationReplyAction,
} from "@/lib/actions/app-actions";
import { getReplyPreviewText } from "@/lib/conversations/message-display";
import {
  buildOptimisticMediaMessage,
  formatFileSize,
  isAudioMimeType,
  isImageMimeType,
} from "@/lib/conversations/message-media";
import { cn } from "@/lib/utils";
import { ComposeAttachMenu } from "@/features/conversations/components/compose-attach-menu";
import { InteractiveComposeBubble } from "@/features/conversations/components/interactive-compose-bubble";
import { SendWhatsappTemplateDialog } from "@/features/conversations/components/send-whatsapp-template-dialog";
import { WhatsappServiceWindowIndicator } from "@/features/conversations/components/whatsapp-service-window-indicator";
import { MessageComposePreview } from "@/features/conversations/components/message-compose-preview";
import {
  ComposeFormatToolbar,
  type TextSelection,
} from "@/features/conversations/components/compose-format-toolbar";
import { WhatsAppComposeInput } from "@/features/conversations/components/whatsapp-compose-input";
import { useChatComposePreferences } from "@/features/conversations/hooks/use-chat-compose-preferences";
import {
  formatRecordingDuration,
  useVoiceRecorder,
} from "@/features/conversations/hooks/use-voice-recorder";
import {
  createInteractiveComposeDraft,
  validateInteractiveComposeDraft,
  buildInteractiveFromDraft,
  type InteractiveComposeDraft,
} from "@/lib/conversations/interactive-compose";
import { buildOptimisticInteractiveMessage } from "@/lib/conversations/interactive-message";
import {
  formatServiceWindowCountdown,
  sessionWindowClosedMessage,
  type WhatsappServiceWindowState,
} from "@/lib/conversations/whatsapp-service-window";
import type { OutboundSenderContext } from "@/lib/conversations/outbound-sender";
import type { Message } from "@/types/database.types";

export type ReplyFormSentPayload = {
  text?: string;
  optimistic?: Message;
  serverMessage?: Record<string, unknown> | null;
  /** Vista previa local (p. ej. interactivo WA) — no refrescar contra servidor. */
  previewOnly?: boolean;
  failed?: boolean;
  error?: string;
  optimisticId?: string;
};

type ReplyFormProps = {
  conversationId: string;
  businessId: string;
  outboundSender?: OutboundSenderContext;
  replyingTo?: Message | null;
  serviceWindow?: WhatsappServiceWindowState;
  handoffReason?: string | null;
  humanModeRequired?: boolean;
  onCancelReply?: () => void;
  onSent?: (payload: ReplyFormSentPayload) => void;
};

export function ReplyForm({
  conversationId,
  businessId,
  outboundSender,
  replyingTo,
  serviceWindow,
  handoffReason,
  humanModeRequired = false,
  onCancelReply,
  onSent,
}: ReplyFormProps) {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [interactiveDraft, setInteractiveDraft] = useState<InteractiveComposeDraft | null>(null);
  const [interactiveShowValidation, setInteractiveShowValidation] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const composeInputRef = useRef<HTMLTextAreaElement>(null);
  const { ready, enterToSend, setEnterToSend } = useChatComposePreferences();
  const voiceRecorder = useVoiceRecorder();
  const canSendSessionMessage = serviceWindow?.canSendSessionMessage ?? true;
  const sessionClosed = !canSendSessionMessage;
  const humanModeMessage =
    "Activa el modo humano para enviar un mensaje al cliente. Con el bot activo no se pueden enviar respuestas desde aquí.";
  const composeLocked = humanModeRequired || sessionClosed;

  function windowClosedToast() {
    return sessionWindowClosedMessage(serviceWindow?.status);
  }

  function sendFailureToast(error: string) {
    if (canSendSessionMessage && isWhatsappSessionWindowError(error)) {
      const remaining = serviceWindow
        ? formatServiceWindowCountdown(serviceWindow.remainingMs)
        : null;
      return remaining
        ? `WhatsApp rechazó el envío, pero esta conversación todavía tiene ${remaining} de ventana abierta. Reintenta desde el globo.`
        : "WhatsApp rechazó el envío, pero la ventana de esta conversación sigue abierta. Reintenta desde el globo.";
    }
    return error;
  }

  const trimmedText = text.trim();
  const hasInteractiveDraft = Boolean(interactiveDraft);
  const interactiveCanSend = interactiveDraft
    ? Boolean(buildInteractiveFromDraft(interactiveDraft))
    : false;
  const hasVoiceNote = voiceRecorder.status === "recorded" && voiceRecorder.blob;
  const isRecording = voiceRecorder.status === "recording";
  const showSendButton = Boolean(
    trimmedText || attachedFile || hasVoiceNote || (hasInteractiveDraft && interactiveCanSend)
  );
  const primaryAction: "send" | "mic" | "stop" = isRecording
    ? "stop"
    : hasInteractiveDraft || showSendButton
      ? "send"
      : "mic";

  useEffect(() => {
    setText("");
    setShowPreview(false);
    setTextSelection(null);
    clearAttachment();
    voiceRecorder.reset();
    setInteractiveDraft(null);
    setInteractiveShowValidation(false);
    setTemplateDialogOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset al cambiar cita
  }, [replyingTo?.id]);

  useEffect(() => {
    setInteractiveDraft(null);
    setInteractiveShowValidation(false);
  }, [conversationId]);

  useEffect(() => {
    if (voiceRecorder.error) {
      toast.error(voiceRecorder.error);
    }
  }, [voiceRecorder.error]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  function clearAttachment() {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setAttachedFile(null);
    setFilePreviewUrl(null);
  }

  function handleFileSelected(file: File) {
    if (humanModeRequired) {
      toast.error(humanModeMessage);
      return;
    }
    if (!canSendSessionMessage) {
      toast.error(windowClosedToast());
      return;
    }
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    voiceRecorder.reset();
    setAttachedFile(file);
    const needsPreview = isImageMimeType(file.type) || isAudioMimeType(file.type);
    setFilePreviewUrl(needsPreview ? URL.createObjectURL(file) : null);
    setShowPreview(false);
  }

  function handleInteractiveComposeOpen(variant: "button" | "list") {
    if (humanModeRequired) {
      toast.error(humanModeMessage);
      return;
    }
    if (!canSendSessionMessage) {
      toast.error(windowClosedToast());
      return;
    }
    clearAttachment();
    voiceRecorder.reset();
    setText("");
    setShowPreview(false);
    setInteractiveShowValidation(false);
    setInteractiveDraft(createInteractiveComposeDraft(variant));
  }

  function handleWhatsappTemplateOpen() {
    if (humanModeRequired) {
      toast.error(humanModeMessage);
      return;
    }
    clearAttachment();
    voiceRecorder.reset();
    setText("");
    setShowPreview(false);
    setInteractiveDraft(null);
    setInteractiveShowValidation(false);
    setTemplateDialogOpen(true);
  }

  function handleCancelInteractive() {
    setInteractiveShowValidation(false);
    setInteractiveDraft(null);
  }

  function handleInteractiveDraftChange(draft: InteractiveComposeDraft) {
    setInteractiveDraft(draft);
  }

  function handleSendInteractive() {
    if (!interactiveDraft) return;

    const validation = validateInteractiveComposeDraft(interactiveDraft);
    if (!validation.ok) {
      setInteractiveShowValidation(true);
      toast.error(validation.error);
      return;
    }

    setInteractiveShowValidation(false);

    const interactive = validation.interactive;
    const optimistic = buildOptimisticInteractiveMessage({
      conversationId,
      businessId,
      interactive,
      senderUserId: outboundSender?.userId,
      senderDisplayName: outboundSender?.displayName,
    });

    onSent?.({ optimistic });
    setInteractiveDraft(null);
    onCancelReply?.();

    startTransition(async () => {
      try {
        const result = await sendConversationInteractiveAction(conversationId, {
          interactive,
          ...(replyingTo ? { reply_to_message_id: replyingTo.id } : {}),
        });
        if (!result.ok) {
          const error = sendFailureToast(result.error);
          toast.error(error);
          onSent?.({ failed: true, optimisticId: optimistic.id, error });
          return;
        }
        toast.success("Mensaje interactivo enviado por WhatsApp");
        setInteractiveShowValidation(false);
        onSent?.({ serverMessage: result.message });
        router.refresh();
      } catch (error) {
        const message = userFacingActionError(error, "No se pudo enviar el mensaje interactivo");
        toast.error(sendFailureToast(message));
        onSent?.({ failed: true, optimisticId: optimistic.id, error: message });
      }
    });
  }

  async function sendMediaFile(
    file: File,
    caption: string,
    previewUrl: string
  ) {
    const optimistic = buildOptimisticMediaMessage({
      conversationId,
      businessId,
      file,
      caption: isAudioMimeType(file.type) ? undefined : caption,
      previewUrl,
      replyToMessageId: replyingTo?.id,
      senderUserId: outboundSender?.userId,
      senderDisplayName: outboundSender?.displayName,
    });

    onSent?.({ text: caption, optimistic });
    clearAttachment();
    voiceRecorder.reset();
    setText("");
    onCancelReply?.();

    const formData = new FormData();
    formData.append("file", file);
    if (caption && !isAudioMimeType(file.type)) formData.append("caption", caption);
    if (replyingTo) formData.append("reply_to_message_id", replyingTo.id);

    const result = await sendConversationMediaAction(conversationId, formData);
    if (!result.ok) {
      const error = sendFailureToast(result.error);
      onSent?.({ failed: true, optimisticId: optimistic.id, text: caption, error });
      throw new Error(error);
    }
    toast.success(
      isAudioMimeType(file.type) ? "Audio enviado por WhatsApp" : "Archivo enviado por WhatsApp"
    );
    onSent?.({ serverMessage: result.message });
    router.refresh();
  }

  function handleFormatApplied(nextText: string, nextSelection: TextSelection) {
    setText(nextText);
    setTextSelection(nextSelection);

    window.requestAnimationFrame(() => {
      const textarea = composeInputRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextSelection.start, nextSelection.end);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (humanModeRequired) {
      toast.error(humanModeMessage);
      return;
    }

    if (!canSendSessionMessage) {
      toast.error(windowClosedToast());
      return;
    }

    if (hasInteractiveDraft) {
      handleSendInteractive();
      return;
    }

    const trimmed = text.trim();

    if (hasVoiceNote && voiceRecorder.blob && voiceRecorder.filename && voiceRecorder.mimeType) {
      const file = new File([voiceRecorder.blob], voiceRecorder.filename, {
        type: voiceRecorder.mimeType,
      });
      const previewUrl = URL.createObjectURL(file);

      startTransition(async () => {
        try {
          await sendMediaFile(file, "", previewUrl);
        } catch (error) {
          const message = sendFailureToast(
            userFacingActionError(error, "No se pudo enviar el audio")
          );
          toast.error(message);
        }
      });
      return;
    }

    if (attachedFile) {
      const previewUrl = filePreviewUrl ?? URL.createObjectURL(attachedFile);

      startTransition(async () => {
        try {
          await sendMediaFile(attachedFile, trimmed, previewUrl);
        } catch (error) {
          const message = sendFailureToast(
            userFacingActionError(error, "No se pudo enviar el archivo")
          );
          toast.error(message);
        }
      });
      return;
    }

    if (!trimmed) {
      return;
    }

    onSent?.({ text: trimmed });
    setText("");
    onCancelReply?.();

    startTransition(async () => {
      try {
        const result = await sendConversationReplyAction(conversationId, {
          text: trimmed,
          ...(replyingTo ? { reply_to_message_id: replyingTo.id } : {}),
        });
        if (!result.ok) {
          const error = sendFailureToast(result.error);
          toast.error(error);
          onSent?.({ failed: true, text: trimmed, error });
          return;
        }
        toast.success(
          replyingTo ? "Respuesta citada enviada por WhatsApp" : "Mensaje enviado por WhatsApp"
        );
        onSent?.({ text: trimmed, serverMessage: result.message });
        router.refresh();
      } catch (error) {
        const message = sendFailureToast(
          userFacingActionError(error, "No se pudo enviar el mensaje")
        );
        toast.error(message);
        onSent?.({ failed: true, text: trimmed, error: message });
      }
    });
  }

  function handlePrimaryAction() {
    if (primaryAction === "stop") {
      voiceRecorder.stop();
      return;
    }
    if (primaryAction === "mic") {
      if (humanModeRequired) {
        toast.error(humanModeMessage);
        return;
      }
      if (!voiceRecorder.canRecord) {
        toast.error("Tu navegador no soporta grabar notas de voz.");
        return;
      }
      void voiceRecorder.start();
      return;
    }
    formRef.current?.requestSubmit();
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isRecording) return;
    if (humanModeRequired || !enterToSend || pending) return;
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;

    event.preventDefault();
    formRef.current?.requestSubmit();
  }

  const placeholder = replyingTo
    ? attachedFile || hasVoiceNote
      ? isAudioMimeType(attachedFile?.type ?? voiceRecorder.mimeType)
        ? "Las notas de voz no llevan caption"
        : "Caption opcional..."
      : "Escribe tu respuesta citada..."
    : attachedFile || hasVoiceNote
      ? isAudioMimeType(attachedFile?.type ?? voiceRecorder.mimeType)
        ? "Las notas de voz no llevan caption"
        : "Caption opcional..."
      : isRecording
        ? "Grabando nota de voz…"
        : "Escribe un mensaje";

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {humanModeRequired && (
        <p className="mb-3 rounded-lg border border-[#7678ed]/25 bg-[#7678ed]/8 px-3 py-2 text-sm text-[#3f3d8f]">
          Activa el <strong className="font-semibold">modo humano</strong> para enviar un
          mensaje al cliente. Con el bot activo no se pueden enviar respuestas desde aquí.
        </p>
      )}
      {replyingTo && (
        <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border-l-[3px] border-[#00a884] bg-white px-3 py-2 shadow-sm ring-1 ring-[#d1d7db]/60">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#00a884]">Respondiendo a</p>
            <p className="line-clamp-2 text-xs text-[#667781]">
              {getReplyPreviewText(replyingTo)}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 rounded-full p-1 text-[#667781] hover:bg-[#f0f2f5] hover:text-[#111b21]"
            aria-label="Cancelar cita"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {attachedFile && (
        <div className="mb-2 flex items-start gap-3 rounded-lg border border-[#d1d7db]/80 bg-white px-3 py-2 shadow-sm">
          {filePreviewUrl && isImageMimeType(attachedFile.type) ? (
            <img
              src={filePreviewUrl}
              alt="Vista previa"
              className="size-14 shrink-0 rounded-md object-cover"
            />
          ) : filePreviewUrl && isAudioMimeType(attachedFile.type) ? (
            <audio
              src={filePreviewUrl}
              controls
              className="h-10 min-w-0 flex-1"
              preload="metadata"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-[#f0f2f5] text-[11px] font-medium text-[#667781]">
              {attachedFile.name.split(".").pop()?.toUpperCase() ?? "DOC"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#111b21]">{attachedFile.name}</p>
            <p className="text-[11px] text-[#667781]">{formatFileSize(attachedFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={clearAttachment}
            disabled={pending}
            className="shrink-0 rounded-full p-1 text-[#667781] hover:bg-[#f0f2f5] hover:text-[#111b21]"
            aria-label="Quitar archivo"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {hasVoiceNote && voiceRecorder.url && (
        <div className="mb-2 flex items-center gap-3 rounded-lg border border-[#00a884]/30 bg-[#e7f8f3] px-3 py-2 shadow-sm">
          <audio
            src={voiceRecorder.url}
            controls
            className="h-10 min-w-0 flex-1"
            preload="metadata"
          />
          <div className="shrink-0 text-right">
            <p className="text-xs font-medium text-[#111b21]">Nota de voz</p>
            <p className="text-[11px] text-[#667781]">
              {formatRecordingDuration(voiceRecorder.durationSec)} · Pulsa enviar para mandar
            </p>
          </div>
          <button
            type="button"
            onClick={voiceRecorder.reset}
            disabled={pending}
            className="shrink-0 rounded-full p-1 text-[#667781] hover:bg-white/80 hover:text-[#111b21]"
            aria-label="Descartar nota de voz"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {isRecording && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
          </span>
          <span>
            Grabando… {formatRecordingDuration(voiceRecorder.durationSec)} /{" "}
            {formatRecordingDuration(voiceRecorder.maxDurationSec)}
          </span>
          <span className="ml-auto text-xs text-red-600/80">Pulsa el botón para detener</span>
        </div>
      )}

      <div className={cn("flex items-center justify-between gap-3", hasInteractiveDraft ? "mb-3 mt-1" : "mb-2 h-6")}>
        {hasInteractiveDraft ? (
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-xs font-medium text-[#54656f]">
              Mensaje interactivo · {interactiveDraft?.variant === "button" ? "Botones" : "Lista"}
            </p>
            <div className="flex items-center gap-2">
              {serviceWindow ? (
                <WhatsappServiceWindowIndicator
                  state={serviceWindow}
                  handoffReason={handoffReason}
                />
              ) : null}
              <button
                type="button"
                onClick={handleCancelInteractive}
                disabled={pending}
                className="rounded-full p-1 text-[#667781] hover:bg-white hover:text-[#111b21] disabled:opacity-50"
                aria-label="Volver a escribir texto"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <input
                id="compose-preview"
                type="checkbox"
                checked={showPreview}
                disabled={pending}
                onChange={(event) => setShowPreview(event.target.checked)}
                className="size-3.5 rounded border-[#d1d7db] text-[#00a884] accent-[#00a884] focus:ring-[#00a884]/30"
              />
              <Label
                htmlFor="compose-preview"
                className="cursor-pointer text-xs font-medium text-[#667781]"
              >
                Vista previa WhatsApp
              </Label>
            </div>

            <div className="flex h-6 shrink-0 items-center justify-end gap-2">
              {textSelection && !showPreview && !attachedFile && !hasVoiceNote && !isRecording ? (
                <ComposeFormatToolbar
                  text={text}
                  selection={textSelection}
                  onFormat={handleFormatApplied}
                  className="animate-in fade-in-0 slide-in-from-top-0.5 duration-150"
                />
              ) : null}
              {serviceWindow ? (
                <WhatsappServiceWindowIndicator
                  state={serviceWindow}
                  handoffReason={handoffReason}
                />
              ) : null}
            </div>
          </>
        )}
      </div>
      <div
        className={cn(
          "flex gap-2 rounded-3xl bg-white px-3 shadow-sm ring-1 ring-[#d1d7db]",
          hasInteractiveDraft ? "items-end py-3" : "items-end py-2"
        )}
      >
        {hasInteractiveDraft && interactiveDraft ? (
          <div
            className={cn(
              "interactive-compose-scroll flex min-h-0 min-w-0 flex-1 items-start justify-start overflow-y-auto overscroll-contain",
              "pt-2 pb-1",
              "[scrollbar-width:thin] [scrollbar-color:#8696a0_#e9edef]",
              "[&::-webkit-scrollbar]:w-2",
              "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8696a0]/55",
              "[&::-webkit-scrollbar-thumb]:hover:bg-[#667781]/70",
              "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#e9edef]",
              interactiveDraft.variant === "list" ? "max-h-[22rem]" : "max-h-44"
            )}
          >
            <InteractiveComposeBubble
              draft={interactiveDraft}
              disabled={pending}
              showValidation={interactiveShowValidation}
              onChange={handleInteractiveDraftChange}
            />
          </div>
        ) : showPreview ? (
          <div className="min-w-0 flex-1 py-2 pr-2">
            <MessageComposePreview
              text={text}
              placeholder={placeholder}
              attachedFileName={attachedFile?.name}
              attachedFileSize={attachedFile?.size}
              attachedImagePreviewUrl={filePreviewUrl}
            />
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <WhatsAppComposeInput
              ref={composeInputRef}
              value={text}
              onChange={setText}
              onSelectionChange={setTextSelection}
              resetKey={replyingTo?.id ?? "plain"}
              placeholder={
                humanModeRequired
                  ? "Activa el modo humano para escribir al cliente"
                  : canSendSessionMessage
                    ? placeholder
                    : "Ventana cerrada — solo plantillas aprobadas de WhatsApp"
              }
              disabled={pending || isRecording || Boolean(hasVoiceNote) || composeLocked}
              onKeyDown={handleTextareaKeyDown}
            />
          </div>
        )}
        <button
          type={primaryAction === "send" ? "submit" : "button"}
          onClick={primaryAction === "send" ? undefined : handlePrimaryAction}
          disabled={
            pending ||
            composeLocked ||
            (primaryAction === "mic" && !voiceRecorder.canRecord) ||
            (hasInteractiveDraft && !interactiveCanSend)
          }
          className={cn(
            "mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-[#111b21] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            primaryAction === "stop"
              ? "bg-red-500 text-white hover:bg-red-600"
              : primaryAction === "mic"
                ? "bg-[#f0f2f5] text-[#54656f] ring-1 ring-[#d1d7db] hover:bg-[#e9edef]"
                : "bg-[#00a884] hover:bg-[#06cf9c]"
          )}
          aria-label={
            primaryAction === "stop"
              ? "Detener grabación"
              : primaryAction === "mic"
                ? "Grabar nota de voz"
                : pending
                  ? "Enviando mensaje"
                  : "Enviar por WhatsApp"
          }
          title={
            primaryAction === "stop"
              ? "Detener grabación"
              : primaryAction === "mic"
                ? "Grabar nota de voz"
                : pending
                  ? "Enviando..."
                  : "Enviar por WhatsApp"
          }
        >
          {primaryAction === "stop" ? (
            <Square className="size-4 fill-current" />
          ) : primaryAction === "mic" ? (
            <Mic className="size-5" />
          ) : (
            <Send className="size-5" />
          )}
        </button>
      </div>
      <div
        className={cn(
          "mt-2.5 flex items-center gap-3",
          hasInteractiveDraft ? "justify-end" : "justify-between"
        )}
      >
        {!hasInteractiveDraft && (
          <ComposeAttachMenu
            disabled={pending || isRecording || Boolean(hasVoiceNote) || humanModeRequired}
            sessionClosed={sessionClosed}
            onFileSelected={handleFileSelected}
            onInteractivePreview={handleInteractiveComposeOpen}
            onWhatsappTemplate={handleWhatsappTemplateOpen}
          />
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Switch
            id="enter-to-send"
            size="sm"
            checked={enterToSend}
            disabled={!ready || pending}
            onCheckedChange={setEnterToSend}
          />
          <div className="flex items-center gap-1">
            <Label
              htmlFor="enter-to-send"
              className="cursor-pointer text-xs font-medium text-[#667781]"
            >
              Enter para enviar
            </Label>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex rounded-full p-0.5 text-[#667781] transition-colors hover:bg-[#e9edef] hover:text-[#111b21]"
                    aria-label="Ayuda sobre Enter para enviar"
                  />
                }
              >
                <CircleHelp className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="!border-zinc-600 !bg-zinc-700 !text-zinc-100 shadow-lg [&_[class*='rotate-45']]:!bg-zinc-700 [&_[class*='rotate-45']]:!fill-zinc-700"
              >
                {enterToSend
                  ? "Enter envía el mensaje | Shift+Enter nueva línea"
                  : "Enter agrega una línea nueva"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <SendWhatsappTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        conversationId={conversationId}
        businessId={businessId}
        replyToMessageId={replyingTo?.id}
        outboundSender={outboundSender}
        onSent={(payload) => {
          if (payload.optimistic) {
            onSent?.({ optimistic: payload.optimistic });
            onCancelReply?.();
          }
          if (payload.failed) {
            onSent?.({
              failed: true,
              optimisticId: payload.optimisticId,
              error: payload.error,
            });
            return;
          }
          if (payload.serverMessage) {
            onSent?.({ serverMessage: payload.serverMessage });
            router.refresh();
          }
        }}
      />
    </form>
  );
}
