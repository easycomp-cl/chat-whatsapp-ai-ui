-- Vista messages: errores de entrega WhatsApp + payload interactivo (botones/listas).
-- Añade columnas en Message si el deploy backend aún no las tiene (dev local).

ALTER TABLE public."Message"
  ADD COLUMN IF NOT EXISTS "whatsappDeliveryErrorCode" INTEGER,
  ADD COLUMN IF NOT EXISTS "whatsappDeliveryErrorMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "audioTranscript" TEXT;

DROP VIEW IF EXISTS public.messages;

CREATE VIEW public.messages AS
SELECT
  m.id,
  m."conversationId" AS conversation_id,
  m."tenantId" AS business_id,
  m."customerId" AS customer_id,
  m.direction,
  m."senderType" AS sender_type,
  m."senderPhone" AS sender_phone,
  m."receiverPhone" AS receiver_phone,
  m."contentText" AS content_text,
  m."contentType" AS content_type,
  m."contentTextSnapshot" AS content_text_snapshot,
  m."customerEditedAt" AS customer_edited_at,
  m."customerRevokedAt" AS customer_revoked_at,
  m."externalId" AS external_id,
  m."whatsappDeliveryStatus"::text AS whatsapp_delivery_status,
  m."whatsappDeliveryErrorCode" AS whatsapp_delivery_error_code,
  m."whatsappDeliveryErrorMessage" AS whatsapp_delivery_error_message,
  m."aiGenerated" AS ai_generated,
  m."replyToMessageId" AS reply_to_message_id,
  m."quotedText" AS quoted_text,
  m."quotedSenderType" AS quoted_sender_type,
  m."createdAt" AS created_at,
  m."audioTranscript" AS audio_transcript,
  CASE
    WHEN m."rawPayloadJson"->'outbound'->'interactive' IS NOT NULL
      AND jsonb_typeof(m."rawPayloadJson"->'outbound'->'interactive') = 'object'
    THEN m."rawPayloadJson"->'outbound'->'interactive'
    ELSE NULL
  END AS interactive,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'emoji', r.emoji,
          'sender_type', r."senderType",
          'sender_phone', r."senderPhone",
          'created_at', r."createdAt"
        )
        ORDER BY r."createdAt"
      )
      FROM public."MessageReaction" r
      WHERE r."messageId" = m.id
    ),
    '[]'::json
  ) AS reactions,
  COALESCE(
    (
      SELECT json_build_object(
        'has_media',
          (
            mm."storagePath" IS NOT NULL
            OR mm."filename" IS NOT NULL
            OR mm."mimeType" IS NOT NULL
          ),
        'mime_type', mm."mimeType",
        'filename', mm."filename",
        'file_size', mm."fileSize",
        'media_url_path',
          CASE
            WHEN mm."storagePath" IS NOT NULL
              OR mm."filename" IS NOT NULL
              OR mm."mimeType" IS NOT NULL
            THEN '/messages/' || m.id || '/media-url'
            ELSE NULL
          END
      )
      FROM public."MessageMedia" mm
      WHERE mm."messageId" = m.id
    ),
    json_build_object(
      'has_media', false,
      'mime_type', NULL,
      'filename', NULL,
      'file_size', NULL,
      'media_url_path', NULL
    )
  ) AS media
FROM public."Message" m;
