-- Vista messages con replies y reacciones agregadas (requiere tablas del bot)
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
  m."externalId" AS external_id,
  m."aiGenerated" AS ai_generated,
  m."replyToMessageId" AS reply_to_message_id,
  m."quotedText" AS quoted_text,
  m."quotedSenderType" AS quoted_sender_type,
  m."createdAt" AS created_at,
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
  ) AS reactions
FROM public."Message" m;

-- RLS lectura reacciones (mismo tenant que el mensaje)
ALTER TABLE public."MessageReaction" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS message_reaction_select ON public."MessageReaction";
CREATE POLICY message_reaction_select ON public."MessageReaction"
  FOR SELECT USING (public.can_access_tenant("tenantId"));

-- Realtime para actualizar pills de reacción en el dashboard
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'MessageReaction'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."MessageReaction";
  END IF;
END $$;

ALTER TABLE public."MessageReaction" REPLICA IDENTITY FULL;
