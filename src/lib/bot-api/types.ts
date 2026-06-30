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
