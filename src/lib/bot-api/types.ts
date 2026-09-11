export type KnowledgeDocumentStatus =
  | "PENDING"
  | "INDEXING"
  | "INDEXED"
  | "ERROR";

export type KnowledgeDocument = {
  id: string;
  tenantId: string;
  title: string;
  sourceType: "PDF" | "DOCX" | "TXT" | "MANUAL" | "URL";
  fileUrl: string | null;
  storagePath: string | null;
  mimeType: string | null;
  fileSize: number | null;
  rawText: string | null;
  status: KnowledgeDocumentStatus;
  indexError: string | null;
  indexedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

import type { Conversation, Customer } from "@/types/database.types";

export type CustomerInvoiceType = "RECEIPT" | "INVOICE" | "NONE";

export type CustomerProfileFields = {
  display_alias?: string | null;
  email?: string | null;
  tax_id?: string | null;
  invoice_type?: CustomerInvoiceType | null;
  company_name?: string | null;
  business_activity?: string | null;
  delivery1_line1?: string | null;
  delivery1_commune?: string | null;
  delivery1_region?: string | null;
  delivery1_notes?: string | null;
  profile_metadata?: Record<string, unknown> | null;
};

export type CustomerProfilePatch = Partial<CustomerProfileFields>;

export type FlowRunStatus =
  | "RUNNING"
  | "AWAITING_CUSTOMER"
  | "AWAITING_AGENT_INPUT"
  | "AWAITING_REVIEW"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type FlowDefinitionStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type FlowVersionStatus = "DRAFT" | "PUBLISHED";

export type PendingAgentInputField = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  value?: unknown;
};

export type PendingAgentInput = {
  template: string;
  fields: PendingAgentInputField[];
  prefilled?: Record<string, unknown>;
};

export type ActiveFlowRunInbox = {
  id: string;
  status: FlowRunStatus;
  pending_agent_input: PendingAgentInput | null;
};

export type ActiveFlowRunDetail = ActiveFlowRunInbox & {
  flow_name: string;
  flow_version: number;
  current_node_id: string | null;
};

export type ConversationFlowState = {
  flow_mode_locked: boolean;
  active_flow_run: ActiveFlowRunDetail | ActiveFlowRunInbox | null;
};

/** Respuesta de GET /businesses/:id/conversations/inbox (snake_case, alineado con Supabase). */
export type InboxConversation = Conversation & {
  customers: Customer | null;
  last_message_preview?: string | null;
  flow_mode_locked?: boolean;
  active_flow_run?: ActiveFlowRunInbox | null;
};

export type FlowAdminRef = {
  id: string;
  name: string;
};

export type FlowTrigger = {
  id: string;
  tenant_id: string;
  flow_version_id: string;
  trigger_type: string;
  channel: string | null;
  priority: number;
  configuration_json: Record<string, unknown>;
  is_enabled: boolean;
  has_webhook_secret: boolean;
  created_at: string;
};

export type FlowVersion = {
  id: string;
  tenant_id: string;
  flow_definition_id: string;
  version_number: number;
  status: FlowVersionStatus;
  published_at: string | null;
  graph_json?: unknown;
  triggers?: FlowTrigger[];
  created_by_admin_id: string;
  created_by_admin?: FlowAdminRef;
  created_at: string;
};

export type FlowDefinition = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: FlowDefinitionStatus;
  current_version_id: string | null;
  current_version: FlowVersion | null;
  versions_count?: number;
  created_by_admin_id: string;
  created_by_admin?: FlowAdminRef;
  updated_by_admin_id: string | null;
  updated_by_admin?: FlowAdminRef | null;
  created_at: string;
  updated_at: string;
};

export type FlowRun = {
  id: string;
  tenant_id: string;
  flow_version_id: string;
  conversation_id: string;
  customer_id: string;
  current_node_id: string | null;
  status: FlowRunStatus;
  variables_json: Record<string, unknown> | null;
  pending_agent_input: PendingAgentInput | null;
  started_by: string;
  started_by_admin_id: string | null;
  lock_version: number;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type FlowRunDetail = FlowRun & {
  flow_name?: string;
  flow_version?: number;
  pending_review?: FlowReview | null;
};

export type FlowReviewStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

export type FlowReviewFile = {
  id: string;
  original_filename: string;
  mime_type: string;
  file_size?: number;
  signed_url: string;
  signed_url_expires_in_seconds: number;
};

export type FlowReview = {
  id: string;
  tenant_id: string;
  flow_run_id: string;
  node_id: string;
  reviewer_admin_id: string | null;
  subject_type: string;
  subject_reference: string | null;
  status: FlowReviewStatus;
  resolution: string | null;
  notes: string | null;
  attempt: number;
  created_at: string;
  resolved_at: string | null;
  file?: FlowReviewFile;
};

export type FlowWebhookDeliveryStatus =
  | "PENDING"
  | "DELIVERING"
  | "DELIVERED"
  | "FAILED"
  | "DEAD_LETTER";

export type FlowWebhookDelivery = {
  id: string;
  tenant_id: string;
  flow_run_id: string;
  flow_run_event_id: string | null;
  node_id: string | null;
  event_type: string;
  target_url: string;
  payload_json: Record<string, unknown>;
  status: FlowWebhookDeliveryStatus;
  attempt_count: number;
  max_attempts: number;
  last_http_status: number | null;
  last_error: string | null;
  last_attempt_at: string | null;
  delivered_at: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FlowWebhookIntegration =
  | { configured: false }
  | {
      configured: true;
      url: string;
      enabled: boolean;
      events: string[] | null;
      has_secret: boolean;
      webhook_secret?: string;
    };

export type FlowSimulationResult = {
  detected_intent: string | null;
  captured_fields: Record<string, unknown>;
  missing_fields: string[];
  doubtful_fields: string[];
  current_node_id: string | null;
  next_node_id: string | null;
  next_message: string | null;
  evaluated_conditions: Array<{
    edge_id: string;
    matched: boolean;
    reason: string;
  }>;
  output_preview: Record<string, unknown> | null;
  logs: string[];
};

export type FlowRunResult = FlowRun & {
  replies?: string[];
  sent_messages?: unknown[];
};

export type SignedUrlResponse = {
  file_id: string;
  signed_url: string;
  expires_in_seconds: number;
};

export type Faq = {
  id: string;
  tenantId: string;
  question: string;
  answer: string;
  category: string | null;
  priority: number;
  alternatePhrases: string[];
  keywords: string[];
  searchText: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogProduct = {
  id: string;
  tenantId: string;
  externalId: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  category: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  source: "MANUAL" | "CSV" | "JSON" | "SHOPIFY";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeSettings = {
  enabled: boolean;
  topK: number;
  chunkSize: number;
  chunkOverlap: number;
  minConfidence?: number;
  faqSimilarityThreshold?: number;
  autoIndexOnCreate: boolean;
};

export type BusinessSettings = {
  id: string;
  bot_global_enabled: boolean;
  confidence_threshold: number;
  default_ai_model: string;
  knowledge?: KnowledgeSettings;
};

export type ShopifyIntegration =
  | { connected: false }
  | {
      connected?: true;
      id: string;
      provider: "SHOPIFY";
      shopDomain: string;
      lastSyncAt: string | null;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };

export type ImportResult = {
  products_imported?: number;
  products_synced?: number;
  documentId: string;
};

export type CreateFaqBody = {
  question: string;
  answer: string;
  category?: string;
  priority?: number;
  active?: boolean;
  alternate_phrases?: string[];
  keywords?: string[];
};

export type CreateKnowledgeBody = {
  title: string;
  source_type?: string;
  raw_text?: string;
  file_url?: string;
  auto_index?: boolean;
};

export type KnowledgeDocumentDetail = KnowledgeDocument & {
  content: string | null;
  chunkCount: number;
};

export type KnowledgeSettingsInput = {
  enabled?: boolean;
  top_k?: number;
  chunk_size?: number;
  chunk_overlap?: number;
  min_confidence?: number;
  faq_similarity_threshold?: number;
  auto_index_on_create?: boolean;
};

export type ImportJobStatus = "pending" | "processing" | "completed" | "failed";

export type FaqSuggestionStatus =
  | "pending_review"
  | "edited"
  | "approved"
  | "rejected"
  | "archived";

export type ToneAnalysisStatus = "pending_review" | "approved" | "rejected";

export type GreetingWarmth = "formal" | "neutral" | "warm";

export type SuggestedGreeting = {
  text: string;
  warmth: GreetingWarmth;
  source: string;
  usage_count?: number;
};

export type GreetingConfig = {
  new_customer_warmth: GreetingWarmth;
  returning_customer_warmth: GreetingWarmth;
  returning_min_messages: number;
  combine_greeting_with_answers: boolean;
};

export const DEFAULT_GREETING_CONFIG: GreetingConfig = {
  new_customer_warmth: "neutral",
  returning_customer_warmth: "warm",
  returning_min_messages: 3,
  combine_greeting_with_answers: true,
};

export const WARMTH_LABELS: Record<GreetingWarmth, string> = {
  formal: "Formal",
  neutral: "Neutral",
  warm: "Cercano",
};

export type SenderRole = "customer" | "business" | "unknown";

export interface ImportJob {
  id: string;
  status: ImportJobStatus;
  total_messages: number;
  customer_messages_count: number;
  business_messages_count: number;
  detected_faq_count: number;
  detected_tone_summary: string | null;
  error_message: string | null;
  original_filename: string;
  business_sender_name: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  progress_percent?: number | null;
  progress_step?: string | null;
}

export interface ChatImportUploadResult {
  import_job_id: string;
  status: ImportJobStatus;
  message: string;
}

export interface ImportedMessage {
  id: string;
  message_at: string | null;
  sender_label: string | null;
  sender_role: SenderRole;
  content: string | null;
  content_anonymized: string | null;
  is_question: boolean;
  is_business_response: boolean;
}

export interface PaginatedMessages {
  items: ImportedMessage[];
  total: number;
  page: number;
  limit: number;
  sample_only?: boolean;
}

export interface PaginatedImportJobs {
  items: ImportJob[];
  total: number;
  page: number;
  limit: number;
}

export interface ConsolidatedToneAnalysis extends ToneAnalysis {
  is_consolidated: boolean;
  source_tone_analysis_ids: string[];
  source_import_jobs: Array<{ id: string; filename: string | null }>;
}

export interface PendingFaqSuggestion extends FaqSuggestion {
  import_job_id: string | null;
  import_filename: string | null;
}

export interface ToneAnalysis {
  id: string;
  tone_summary: string;
  communication_style: string | null;
  common_phrases: string[];
  suggested_greetings?: SuggestedGreeting[];
  filler_words?: string[];
  greeting_config?: GreetingConfig;
  emoji_usage: string | null;
  response_length: string | null;
  sales_style: string | null;
  formality_level: string | null;
  recommended_bot_rules: Record<string, unknown>;
  confidence: number | null;
  status: ToneAnalysisStatus;
}

export interface FaqSuggestion {
  id: string;
  question: string;
  suggested_answer: string | null;
  category: string | null;
  evidence_count: number;
  confidence: number | null;
  status: FaqSuggestionStatus;
}

export type ApproveToneBody = {
  tone_summary?: string;
  common_phrases?: string[];
  rules?: {
    use_emojis?: string | boolean;
    response_length?: string;
    style?: string;
    offer_next_step?: boolean;
    avoid_long_explanations?: boolean;
    suggested_greetings?: SuggestedGreeting[];
    filler_words?: string[];
    greeting_config?: GreetingConfig;
  };
};

export type EditFaqSuggestionBody = {
  question?: string;
  suggested_answer?: string;
  category?: string;
};

export type ApproveFaqSuggestionBody = {
  final_question?: string;
  final_answer?: string;
};

export type DeliveryCommune = {
  id: string;
  region_id: string;
  name: string;
  price_override: number | null;
  is_active: boolean;
  sort_order: number;
  effective_price: number;
};

export type DeliveryRegion = {
  id: string;
  business_id: string;
  name: string;
  courier: string;
  default_price: number;
  is_active: boolean;
  sort_order: number;
  communes: DeliveryCommune[];
  created_at: string;
  updated_at: string;
};

export type CreateDeliveryRegionBody = {
  name: string;
  courier: string;
  default_price: number;
  active?: boolean;
  seed_communes?: boolean;
};

export type PatchDeliveryRegionBody = Partial<CreateDeliveryRegionBody> & {
  sort_order?: number;
};

export type PatchDeliveryCommuneBody = {
  name?: string;
  price_override?: number | null;
  active?: boolean;
  sort_order?: number;
};

export type SeedDeliveryCommunesResult = {
  seeded: number;
  region: DeliveryRegion;
};

export type ResponseSelection = "random" | "round_robin" | "by_warmth";

export type ConversationalResponseVariant = {
  text: string;
  warmth?: GreetingWarmth;
  weight?: number;
};

export type ConversationalResponse = {
  trigger: string;
  enabled: boolean;
  selection: ResponseSelection;
  variants: ConversationalResponseVariant[];
};

export type ConversationalTriggerMeta = {
  id: string;
  label: string;
  description: string;
  default_selection: ResponseSelection;
};

export type BotPersonality = {
  bot_name: string;
  bot_tone: string;
  greeting_message: string;
  fallback_message: string;
  handoff_message: string;
  out_of_hours_message: string;
  greeting_config: GreetingConfig;
  tone_greetings: SuggestedGreeting[];
  conversational_responses: ConversationalResponse[];
  handoff_on_low_confidence: boolean;
  placeholders: string[];
  triggers: ConversationalTriggerMeta[];
};

export type BotPersonalityPatch = Partial<
  Pick<
    BotPersonality,
    | "bot_name"
    | "bot_tone"
    | "greeting_message"
    | "fallback_message"
    | "handoff_message"
    | "out_of_hours_message"
    | "greeting_config"
    | "tone_greetings"
    | "conversational_responses"
    | "handoff_on_low_confidence"
  >
>;

export const SELECTION_LABELS: Record<ResponseSelection, string> = {
  random: "Aleatorio",
  round_robin: "Rotación",
  by_warmth: "Por tono del cliente",
};

export const DEFAULT_CONVERSATIONAL_DEFAULTS: Record<string, string> = {
  greeting_pure: "{saludo} ¿En qué te puedo ayudar hoy?",
  thanks: "¡Con gusto! Si necesitas algo más, aquí estoy.",
  ack: "Perfecto. Si tienes otra consulta, escríbeme.",
  soft_fallback: "(usa el mensaje «Sin información»)",
};
