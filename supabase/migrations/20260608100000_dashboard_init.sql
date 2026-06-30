-- Dashboard tables and RLS for EasyComp Bot

CREATE TYPE public.user_role AS ENUM ('SUPER_ADMIN', 'BUSINESS_ADMIN', 'AGENT');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT REFERENCES public."Tenant"(id) ON DELETE SET NULL,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'BUSINESS_ADMIN',
  agent_id TEXT REFERENCES public."TenantAdmin"(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL REFERENCES public."Tenant"(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES public."Conversation"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX conversation_notes_conversation_id_idx ON public.conversation_notes(conversation_id);
CREATE INDEX profiles_business_id_idx ON public.profiles(business_id);

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles WHERE user_id = auth.uid() AND active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_agent_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agent_id FROM public.profiles WHERE user_id = auth.uid() AND active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN' AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_tenant(tenant_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR (public.get_user_business_id() = tenant_id AND public.get_user_role() IN ('BUSINESS_ADMIN', 'AGENT'));
$$;

-- Views with spec-friendly names
CREATE OR REPLACE VIEW public.businesses AS
SELECT
  id,
  name,
  slug,
  "businessType" AS business_type,
  status,
  "botGlobalEnabled" AS bot_global_enabled,
  "defaultAiModel" AS default_ai_model,
  "confidenceThreshold" AS confidence_threshold,
  timezone,
  "metadataJson" AS metadata_json,
  "createdAt" AS created_at,
  "updatedAt" AS updated_at
FROM public."Tenant";

CREATE OR REPLACE VIEW public.whatsapp_accounts AS
SELECT
  id,
  "tenantId" AS business_id,
  "channelType" AS channel_type,
  "phoneNumber" AS phone_number,
  "phoneNumberId" AS phone_number_id,
  "wabaId" AS waba_id,
  status,
  "isActive" AS is_active,
  "createdAt" AS created_at,
  "updatedAt" AS updated_at
FROM public."TenantChannel";

CREATE OR REPLACE VIEW public.customers AS
SELECT
  id,
  "tenantId" AS business_id,
  "phoneNumber" AS phone_number,
  name,
  "firstSeenAt" AS first_seen_at,
  "lastSeenAt" AS last_seen_at
FROM public."Customer";

CREATE OR REPLACE VIEW public.conversations AS
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
  "createdAt" AS created_at,
  "updatedAt" AS updated_at
FROM public."Conversation";

CREATE OR REPLACE VIEW public.messages AS
SELECT
  id,
  "conversationId" AS conversation_id,
  "tenantId" AS business_id,
  "customerId" AS customer_id,
  direction,
  "senderType" AS sender_type,
  "senderPhone" AS sender_phone,
  "receiverPhone" AS receiver_phone,
  "contentText" AS content_text,
  "contentType" AS content_type,
  "externalId" AS external_id,
  "aiGenerated" AS ai_generated,
  "createdAt" AS created_at
FROM public."Message";

CREATE OR REPLACE VIEW public.faqs AS
SELECT
  id,
  "tenantId" AS business_id,
  question,
  answer,
  category,
  priority,
  "isActive" AS active,
  "createdAt" AS created_at,
  "updatedAt" AS updated_at
FROM public."TenantFaq";

CREATE OR REPLACE VIEW public.knowledge_documents AS
SELECT
  id,
  "tenantId" AS business_id,
  title,
  "sourceType" AS source_type,
  "fileUrl" AS file_url,
  "rawText" AS raw_text,
  status,
  "indexedAt" AS indexed_at,
  "createdAt" AS created_at,
  "updatedAt" AS updated_at
FROM public."TenantDocument";

CREATE OR REPLACE VIEW public.business_agents AS
SELECT
  id,
  "tenantId" AS business_id,
  name,
  "phoneNumber" AS phone,
  role,
  "notifyOnHandoff" AS notify_on_handoff,
  "isPrimary" AS is_primary,
  "isActive" AS active,
  "createdAt" AS created_at,
  "updatedAt" AS updated_at
FROM public."TenantAdmin";

CREATE OR REPLACE VIEW public.usage_events AS
SELECT
  id,
  "tenantId" AS business_id,
  "conversationId" AS conversation_id,
  "eventType" AS event_type,
  "tokensInput" AS tokens_input,
  "tokensOutput" AS tokens_output,
  "estimatedCost" AS estimated_cost,
  metadata,
  "createdAt" AS created_at
FROM public."UsageEvent";

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    false
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY profiles_update_super ON public.profiles
  FOR UPDATE USING (public.is_super_admin());

CREATE POLICY profiles_select_super ON public.profiles
  FOR ALL USING (public.is_super_admin());

-- RLS: conversation_notes
ALTER TABLE public.conversation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_select ON public.conversation_notes
  FOR SELECT USING (public.can_access_tenant(business_id));

CREATE POLICY notes_insert ON public.conversation_notes
  FOR INSERT WITH CHECK (
    public.can_access_tenant(business_id)
    AND user_id = auth.uid()
  );

-- RLS on Prisma tables (SELECT)
ALTER TABLE public."Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TenantChannel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TenantFaq" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TenantDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TenantAdmin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UsageEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TenantConfig" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_select ON public."Tenant"
  FOR SELECT USING (public.can_access_tenant(id));

CREATE POLICY tenant_channel_select ON public."TenantChannel"
  FOR SELECT USING (public.can_access_tenant("tenantId"));

CREATE POLICY customer_select ON public."Customer"
  FOR SELECT USING (public.can_access_tenant("tenantId"));

CREATE POLICY conversation_select ON public."Conversation"
  FOR SELECT USING (
    public.is_super_admin()
    OR (
      public.can_access_tenant("tenantId")
      AND (
        public.get_user_role() = 'BUSINESS_ADMIN'
        OR "assignedAdminId" = public.get_user_agent_id()
        OR "assignedAdminId" IS NULL
      )
    )
  );

CREATE POLICY message_select ON public."Message"
  FOR SELECT USING (public.can_access_tenant("tenantId"));

CREATE POLICY faq_select ON public."TenantFaq"
  FOR SELECT USING (public.can_access_tenant("tenantId"));

CREATE POLICY document_select ON public."TenantDocument"
  FOR SELECT USING (public.can_access_tenant("tenantId"));

CREATE POLICY admin_select ON public."TenantAdmin"
  FOR SELECT USING (public.can_access_tenant("tenantId"));

CREATE POLICY usage_select ON public."UsageEvent"
  FOR SELECT USING (public.can_access_tenant("tenantId"));

CREATE POLICY config_select ON public."TenantConfig"
  FOR SELECT USING (public.can_access_tenant("tenantId"));
