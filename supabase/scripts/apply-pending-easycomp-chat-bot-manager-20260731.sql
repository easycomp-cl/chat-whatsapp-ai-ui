-- =============================================================================
-- easycomp-chat-bot-manager — Script único para aplicar en Supabase (SQL Editor o psql)
-- Proyecto: pcbwycrgbuioumsopqbe
-- Fecha: 2026-07-31
--
-- Incluye:
--   1. Mi Perfil (profiles: first_name, last_name, personal_phone + RLS)
--   2. Vista messages: audio_transcript, errores de entrega, interactive (botones/listas)
--
-- Es idempotente: se puede ejecutar más de una vez sin romper nada.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Mi Perfil
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS personal_phone TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own ON public.profiles
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2) Columnas en Message (si el backend aún no las tiene en esta BD)
-- -----------------------------------------------------------------------------

ALTER TABLE public."Message"
  ADD COLUMN IF NOT EXISTS "whatsappDeliveryErrorCode" INTEGER,
  ADD COLUMN IF NOT EXISTS "whatsappDeliveryErrorMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "audioTranscript" TEXT;

-- -----------------------------------------------------------------------------
-- 3) Vista public.messages (reemplaza la anterior)
-- -----------------------------------------------------------------------------

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

COMMIT;

-- -----------------------------------------------------------------------------
-- Verificación (opcional — revisar resultados tras ejecutar)
-- -----------------------------------------------------------------------------

-- Columnas en profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('first_name', 'last_name', 'personal_phone')
ORDER BY column_name;

-- Columnas en la vista messages
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'messages'
  AND column_name IN (
    'audio_transcript',
    'whatsapp_delivery_error_code',
    'whatsapp_delivery_error_message',
    'interactive'
  )
ORDER BY column_name;

-- Política Mi Perfil
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND policyname = 'profiles_update_own';
