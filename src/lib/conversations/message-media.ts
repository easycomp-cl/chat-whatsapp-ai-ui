import type { Message, MessageMedia } from "@/types/database.types";

export type ContentType = "TEXT" | "IMAGE" | "DOCUMENT" | "AUDIO" | "INTERACTIVE";

export const MEDIA_PLACEHOLDER_IMAGE = "[Imagen]";
export const MEDIA_PLACEHOLDER_DOCUMENT = "[Documento]";
export const MEDIA_PLACEHOLDER_AUDIO = "[Audio]";

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_MAX_BYTES = 50 * 1024 * 1024;
export const AUDIO_MAX_BYTES = 16 * 1024 * 1024;
/** Límite de grabación de nota de voz desde el micrófono (segundos). */
export const VOICE_NOTE_MAX_DURATION_SEC = 60;

const AUDIO_FILE_EXTENSION_RE = /\.(webm|ogg|m4a|mp3|opus|aac|amr|wav|mp4)$/i;

export const ACCEPTED_AUDIO_MIME_TYPES = [
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/amr",
  "audio/webm",
] as const;

export const ACCEPTED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ...ACCEPTED_AUDIO_MIME_TYPES,
] as const;

export const COMPOSE_IMAGE_ACCEPT = "image/jpeg,image/png";
export const COMPOSE_AUDIO_ACCEPT =
  "audio/ogg,audio/mpeg,audio/mp4,audio/aac,audio/amr,audio/webm,.ogg,.mp3,.m4a,.aac,.amr,.webm";
export const COMPOSE_PDF_ACCEPT = "application/pdf";
export const COMPOSE_EXCEL_ACCEPT =
  "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const COMPOSE_WORD_ACCEPT =
  "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ComposeAttachCategory = "image" | "pdf" | "excel" | "word" | "audio";

const COMPOSE_CATEGORY_MIME: Record<ComposeAttachCategory, readonly string[]> = {
  image: ["image/jpeg", "image/png"],
  pdf: ["application/pdf"],
  excel: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  word: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  audio: [...ACCEPTED_AUDIO_MIME_TYPES],
};

export const MEDIA_FILE_ACCEPT = ACCEPTED_MEDIA_MIME_TYPES.join(",");

export const EMPTY_MESSAGE_MEDIA: MessageMedia = {
  has_media: false,
  mime_type: null,
  filename: null,
  file_size: null,
  media_url_path: null,
};

export function parseMessageMedia(raw: unknown): MessageMedia {
  if (!raw) return EMPTY_MESSAGE_MEDIA;
  if (typeof raw === "string") {
    try {
      return parseMessageMedia(JSON.parse(raw));
    } catch {
      return EMPTY_MESSAGE_MEDIA;
    }
  }
  if (typeof raw !== "object") return EMPTY_MESSAGE_MEDIA;

  const record = raw as Record<string, unknown>;
  return {
    has_media: Boolean(record.has_media ?? record.hasMedia),
    mime_type: (record.mime_type ?? record.mimeType ?? null) as string | null,
    filename: (record.filename ?? null) as string | null,
    file_size: (record.file_size ?? record.fileSize ?? null) as number | null,
    media_url_path: (record.media_url_path ?? record.mediaUrlPath ?? null) as string | null,
  };
}

export function normalizeContentType(value: string | null | undefined): ContentType {
  const upper = (value ?? "TEXT").toUpperCase();
  if (
    upper === "IMAGE" ||
    upper === "DOCUMENT" ||
    upper === "AUDIO" ||
    upper === "INTERACTIVE"
  ) {
    return upper;
  }
  return "TEXT";
}

export function isImageContentType(contentType: string | null | undefined) {
  return normalizeContentType(contentType) === "IMAGE";
}

export function isDocumentContentType(contentType: string | null | undefined) {
  return normalizeContentType(contentType) === "DOCUMENT";
}

export function isAudioContentType(contentType: string | null | undefined) {
  return normalizeContentType(contentType) === "AUDIO";
}

export function isInteractiveContentType(contentType: string | null | undefined) {
  return normalizeContentType(contentType) === "INTERACTIVE";
}

export function isMediaMessage(message: Message) {
  const type = normalizeContentType(message.content_type);
  return type === "IMAGE" || type === "DOCUMENT" || type === "AUDIO";
}

export function isAudioMimeType(mimeType: string) {
  const base = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  return base.startsWith("audio/");
}

/** Texto que no es transcripción real (placeholder, nombre de archivo del envío, etc.). */
export function isAudioContentTextNoise(
  text: string | null | undefined,
  mediaFilename?: string | null
): boolean {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return true;
  if (trimmed === MEDIA_PLACEHOLDER_AUDIO || trimmed === "[Audio]") return true;
  const mediaName = mediaFilename?.trim();
  if (mediaName && trimmed === mediaName) return true;
  if (/^nota-voz\./i.test(trimmed)) return true;
  if (AUDIO_FILE_EXTENSION_RE.test(trimmed) && !trimmed.includes(" ")) return true;
  return false;
}

export function getAudioTranscriptText(message: Message): string | null {
  const transcript = message.audio_transcript?.trim();
  if (transcript) return transcript;

  const text = message.content_text?.trim() ?? "";
  if (!text || isAudioContentTextNoise(text, message.media?.filename)) return null;
  return text;
}

export function isAudioPendingTranscript(message: Message): boolean {
  if (!isAudioContentType(message.content_type)) return false;
  // Solo los audios entrantes del cliente pasan por Whisper en el backend.
  if (message.direction !== "INBOUND") return false;
  if (message.audio_transcript?.trim()) return false;
  const text = message.content_text?.trim() ?? "";
  return isAudioContentTextNoise(text, message.media?.filename);
}

export function getMediaCaption(message: Message): string | null {
  const type = normalizeContentType(message.content_type);
  const text = message.content_text?.trim() ?? "";
  if (!text) return null;
  if (type === "IMAGE" && text === MEDIA_PLACEHOLDER_IMAGE) return null;
  if (type === "DOCUMENT" && text === MEDIA_PLACEHOLDER_DOCUMENT) return null;
  if (type === "AUDIO") return null;
  return text;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageMimeType(mimeType: string) {
  return mimeType.startsWith("image/");
}

export function validateAudioFile(file: File): { ok: true } | { ok: false; error: string } {
  const baseMime = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  const allowed = ACCEPTED_AUDIO_MIME_TYPES.some(
    (mime) => baseMime === mime || file.type.toLowerCase().startsWith(`${mime};`)
  );
  if (!allowed && !isAudioMimeType(file.type)) {
    return {
      ok: false,
      error: "Tipo de audio no soportado. Usa OGG, MP3, M4A, AAC, AMR o WEBM.",
    };
  }
  if (file.size > AUDIO_MAX_BYTES) {
    return {
      ok: false,
      error: "El audio supera el límite de WhatsApp (16 MB).",
    };
  }
  return { ok: true };
}

export function validateMediaFile(file: File): { ok: true } | { ok: false; error: string } {
  if (isAudioMimeType(file.type)) {
    return validateAudioFile(file);
  }

  if (!ACCEPTED_MEDIA_MIME_TYPES.includes(file.type as typeof ACCEPTED_MEDIA_MIME_TYPES[number])) {
    return {
      ok: false,
      error: "Tipo de archivo no soportado. Usa JPG, PNG, PDF, Word o Excel.",
    };
  }

  const isImage = isImageMimeType(file.type);
  const maxBytes = isImage ? IMAGE_MAX_BYTES : DOCUMENT_MAX_BYTES;
  if (file.size > maxBytes) {
    const limitLabel = isImage ? "5 MB" : "50 MB";
    return {
      ok: false,
      error: `El archivo supera el límite de ${limitLabel}.`,
    };
  }

  return { ok: true };
}

export function validateComposeMediaFile(
  file: File,
  category: ComposeAttachCategory
): { ok: true } | { ok: false; error: string } {
  const allowed = COMPOSE_CATEGORY_MIME[category];
  if (!allowed.includes(file.type)) {
    const labels: Record<ComposeAttachCategory, string> = {
      image: "JPG o PNG",
      pdf: "PDF",
      excel: "Excel (.xls o .xlsx)",
      word: "Word (.doc o .docx)",
      audio: "audio (OGG, MP3, M4A…)",
    };
    return { ok: false, error: `Selecciona un archivo ${labels[category]}.` };
  }

  return validateMediaFile(file);
}

export function inferRemoteMedia(
  message: Pick<Message, "id" | "media">,
  base?: MessageMedia | null
): MessageMedia {
  const source = base ?? message.media;
  return {
    has_media: true,
    mime_type: source?.mime_type ?? null,
    filename: source?.filename ?? null,
    file_size: source?.file_size ?? null,
    media_url_path: `/messages/${message.id}/media-url`,
  };
}

export function mayHaveRemoteMedia(message: Message): boolean {
  if (message.media?.has_media) return true;

  const type = normalizeContentType(message.content_type);
  if (type === "IMAGE" || type === "DOCUMENT" || type === "AUDIO") {
    if (message.external_id) return true;

    const text = message.content_text?.trim() ?? "";
    if (type === "IMAGE" && (text === MEDIA_PLACEHOLDER_IMAGE || text === "[Imagen]")) {
      return true;
    }
    if (type === "DOCUMENT" && (text === MEDIA_PLACEHOLDER_DOCUMENT || text === "[Documento]")) {
      return true;
    }
    if (type === "AUDIO" && isAudioContentTextNoise(text, message.media?.filename)) {
      return true;
    }
  }

  return false;
}

export function pickBestMessageMedia(server: Message, prev?: Message): MessageMedia {
  if (server.media?.has_media) return server.media;
  if (prev?.media?.has_media) return prev.media;
  if (mayHaveRemoteMedia(server)) return inferRemoteMedia(server, prev?.media);
  if (prev && mayHaveRemoteMedia({ ...prev, external_id: server.external_id ?? prev.external_id })) {
    return inferRemoteMedia(server, prev.media);
  }
  return server.media ?? prev?.media ?? EMPTY_MESSAGE_MEDIA;
}

export function enrichMessageMedia(message: Message): Message {
  if (message.media?.has_media || !mayHaveRemoteMedia(message)) return message;
  return {
    ...message,
    media: inferRemoteMedia(message),
  };
}

export function buildOptimisticMediaMessage(params: {
  conversationId: string;
  businessId: string;
  file: File;
  caption?: string;
  previewUrl: string;
  replyToMessageId?: string;
  senderUserId?: string;
  senderDisplayName?: string;
}): Message {
  const isImage = isImageMimeType(params.file.type);
  const isAudio = isAudioMimeType(params.file.type);
  const contentType = isImage ? "IMAGE" : isAudio ? "AUDIO" : "DOCUMENT";
  const placeholder = isImage
    ? MEDIA_PLACEHOLDER_IMAGE
    : isAudio
      ? MEDIA_PLACEHOLDER_AUDIO
      : MEDIA_PLACEHOLDER_DOCUMENT;
  const caption = isAudio ? undefined : params.caption?.trim();

  return {
    id: `optimistic-media-${Date.now()}`,
    conversation_id: params.conversationId,
    business_id: params.businessId,
    direction: "OUTBOUND",
    sender_type: "HUMAN",
    content_text: caption || placeholder,
    content_type: contentType,
    ai_generated: false,
    created_at: new Date().toISOString(),
    whatsapp_delivery_status: "pending",
    reply_to_message_id: params.replyToMessageId ?? null,
    reactions: [],
    media: {
      has_media: true,
      mime_type: params.file.type,
      filename: params.file.name,
      file_size: params.file.size,
      media_url_path: null,
    },
    sender_user_id: params.senderUserId ?? null,
    sender_display_name: params.senderDisplayName ?? null,
    _local_preview_url: params.previewUrl,
  };
}
