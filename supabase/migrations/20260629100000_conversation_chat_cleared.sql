-- Soft-clear chat: hide messages in UI without deleting from DB

ALTER TABLE public."Conversation"
  ADD COLUMN IF NOT EXISTS "chatClearedAt" TIMESTAMPTZ;

DROP VIEW IF EXISTS public.conversations;

CREATE VIEW public.conversations AS
SELECT
  id,
  "tenantId" AS business_id,
  "customerId" AS customer_id,
  channel,
  "channelPhoneNumber" AS channel_phone_number,
  status,
  mode,
  "assignedAdminId" AS assigned_admin_id,
  "handoffReason" AS handoff_reason,
  "botResumeAt" AS bot_resume_at,
  "lastMessageAt" AS last_message_at,
  "chatClearedAt" AS chat_cleared_at,
  "createdAt" AS created_at,
  "updatedAt" AS updated_at
FROM public."Conversation";
