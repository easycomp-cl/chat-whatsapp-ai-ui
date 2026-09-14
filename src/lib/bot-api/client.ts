import "server-only";
import { unstable_cache } from "next/cache";
import type { MetricsSummary, TopQuestion } from "@/types/database.types";
import type {
  ApproveFaqSuggestionBody,
  ApproveToneBody,
  BotPersonality,
  BotPersonalityPatch,
  BusinessSettings,
  CatalogProduct,
  ChatImportUploadResult,
  ConsolidatedToneAnalysis,
  CreateDeliveryRegionBody,
  CreateFaqBody,
  CreateKnowledgeBody,
  DeliveryRegion,
  EditFaqSuggestionBody,
  Faq,
  FaqSuggestion,
  FlowDefinition,
  FlowReview,
  FlowRunDetail,
  FlowRunResult,
  FlowSimulationResult,
  FlowVersion,
  FlowWebhookDelivery,
  FlowWebhookIntegration,
  InboxConversation,
  ImportJob,
  SignedUrlResponse,
  ImportResult,
  ImportedMessage,
  KnowledgeDocument,
  KnowledgeDocumentDetail,
  KnowledgeSettingsInput,
  PaginatedImportJobs,
  PaginatedMessages,
  PatchDeliveryCommuneBody,
  PatchDeliveryRegionBody,
  PendingFaqSuggestion,
  SeedDeliveryCommunesResult,
  ShopifyIntegration,
  ToneAnalysis,
  EmbeddedSignupCompleteBody,
  EmbeddedSignupCompleteResponse,
  WhatsappConnection,
} from "./types";

type BotApiOptions = {
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string | number | undefined>;
};

class BotApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getBaseUrl() {
  const url =
    process.env.BOT_API_BASE_URL || process.env.NEXT_PUBLIC_BOT_API_BASE_URL;
  if (!url) throw new Error("BOT_API_BASE_URL is not configured");
  return url.replace(/\/$/, "");
}

function getApiKey() {
  const secret = process.env.BOT_API_SECRET;
  if (!secret) throw new Error("BOT_API_SECRET is not configured");
  return secret;
}

function getJsonHeaders() {
  return {
    "Content-Type": "application/json",
    "X-API-Key": getApiKey(),
  };
}

function formatHttpErrorBody(text: string, status: number): string {
  const trimmed = text.trim();
  const isHtml = trimmed.startsWith("<") || /<html[\s>]/i.test(trimmed);

  if (isHtml) {
    if (status === 502) {
      return "El backend del bot no respondió correctamente (502 Bad Gateway). Intenta de nuevo en unos minutos o verifica que el servicio esté desplegado.";
    }
    if (status === 503) {
      return "El backend del bot no está disponible en este momento (503). Verifica que chat-whatsapp-ai esté en línea.";
    }
    if (status === 404) {
      return "El endpoint del backend no existe (404). Puede que falte desplegar la versión más reciente del API.";
    }
    return `Error del servidor (${status}).`;
  }

  return trimmed;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return res.statusText;

  try {
    const data = JSON.parse(text) as {
      error?: string;
      message?: string;
      action?: string;
    };
    const message = data.error ?? data.message;
    if (message && data.action) {
      return `${message} ${data.action}`;
    }
    return message ?? formatHttpErrorBody(text, res.status);
  } catch {
    return formatHttpErrorBody(text, res.status);
  }
}

export const BOT_API_UNAVAILABLE_MESSAGE =
  "No se pudo conectar con el backend del bot. Verifica BOT_API_BASE_URL y que el servicio esté disponible.";

function connectionErrorMessage(baseUrl: string): string {
  return `${BOT_API_UNAVAILABLE_MESSAGE} (${baseUrl})`;
}

export function getBotApiErrorMessage(error: unknown): string {
  if (error instanceof BotApiError) return error.message;
  return BOT_API_UNAVAILABLE_MESSAGE;
}

async function runBotFetch<T>(url: string, init: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new BotApiError(connectionErrorMessage(baseUrl), 503);
  }

  if (!res.ok) {
    throw new BotApiError(await parseError(res), res.status);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new BotApiError(
      `El backend respondió ${res.status} con un cuerpo que no es JSON.`,
      res.status
    );
  }
}

async function botFetch<T>(path: string, options: BotApiOptions = {}): Promise<T> {
  const url = new URL(`${getBaseUrl()}${path}`);
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === "number" && Number.isNaN(value)) return;
      url.searchParams.set(key, String(value));
    });
  }

  return runBotFetch<T>(url.toString(), {
    method: options.method ?? "GET",
    headers: getJsonHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
}

async function botFetchMultipart<T>(path: string, formData: FormData): Promise<T> {
  return runBotFetch<T>(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: { "X-API-Key": getApiKey() },
    body: formData,
    cache: "no-store",
  });
}

async function botFetchRaw(path: string): Promise<Response> {
  const url = `${getBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "X-API-Key": getApiKey() },
      cache: "no-store",
    });
  } catch {
    throw new BotApiError(connectionErrorMessage(getBaseUrl()), 503);
  }

  if (!res.ok) {
    throw new BotApiError(await parseError(res), res.status);
  }

  return res;
}

export type MessageMediaUrlResponse = {
  message_id: string;
  content_type: string;
  mime_type: string;
  filename: string | null;
  file_size: number | null;
  media_url: string;
  backend_proxy: boolean;
  expires_in_seconds: number;
};

export const botApi = {
  listBusinesses: () => botFetch<unknown[]>("/businesses"),

  getBusiness: (id: string) => botFetch(`/businesses/${id}`),

  patchBusinessSettings: (
    id: string,
    body: {
      bot_global_enabled?: boolean;
      confidence_threshold?: number;
      default_ai_model?: string;
      knowledge?: KnowledgeSettingsInput;
    }
  ) => botFetch<BusinessSettings>(`/businesses/${id}/settings`, { method: "PATCH", body }),

  getBotPersonality: (businessId: string) =>
    botFetch<BotPersonality>(`/businesses/${businessId}/bot-personality`),

  patchBotPersonality: (businessId: string, body: BotPersonalityPatch) =>
    botFetch<BotPersonality>(`/businesses/${businessId}/bot-personality`, {
      method: "PATCH",
      body,
    }),

  listKnowledgeDocuments: (businessId: string) =>
    botFetch<KnowledgeDocument[]>(`/businesses/${businessId}/knowledge-documents`),

  getKnowledgeDocument: (businessId: string, id: string) =>
    botFetch<KnowledgeDocumentDetail>(
      `/businesses/${businessId}/knowledge-documents/${id}`
    ),

  createKnowledgeDocument: (businessId: string, body: CreateKnowledgeBody) =>
    botFetch<KnowledgeDocument>(`/businesses/${businessId}/knowledge-documents`, {
      method: "POST",
      body,
    }),

  uploadKnowledgeDocument: (businessId: string, file: File | Blob, title?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    return botFetchMultipart<KnowledgeDocument>(
      `/businesses/${businessId}/knowledge-documents/upload`,
      form
    );
  },

  indexKnowledgeDocument: (businessId: string, id: string) =>
    botFetch<KnowledgeDocument>(
      `/businesses/${businessId}/knowledge-documents/${id}/index`,
      { method: "POST" }
    ),

  deleteKnowledgeDocument: (businessId: string, id: string) =>
    botFetch<void>(`/businesses/${businessId}/knowledge-documents/${id}`, {
      method: "DELETE",
    }),

  listFaqs: (businessId: string) =>
    botFetch<Faq[]>(`/businesses/${businessId}/faqs`),

  listConversationsInbox: (
    businessId: string,
    params?: { assigned_admin_id?: string; limit?: number }
  ) =>
    botFetch<{ conversations: InboxConversation[] }>(
      `/businesses/${businessId}/conversations/inbox`,
      { searchParams: params }
    ),

  createFaq: (businessId: string, body: CreateFaqBody) =>
    botFetch<Faq>(`/businesses/${businessId}/faqs`, { method: "POST", body }),

  patchFaq: (businessId: string, id: string, body: Partial<CreateFaqBody>) =>
    botFetch<Faq>(`/businesses/${businessId}/faqs/${id}`, { method: "PATCH", body }),

  deleteFaq: (businessId: string, id: string) =>
    botFetch<void>(`/businesses/${businessId}/faqs/${id}`, { method: "DELETE" }),

  listDeliveryRegions: (businessId: string) =>
    botFetch<DeliveryRegion[]>(`/businesses/${businessId}/delivery/regions`),

  listChileRegions: () => botFetch<string[]>("/delivery/chile-regions"),

  createDeliveryRegion: (businessId: string, body: CreateDeliveryRegionBody) =>
    botFetch<DeliveryRegion>(`/businesses/${businessId}/delivery/regions`, {
      method: "POST",
      body,
    }),

  patchDeliveryRegion: (
    businessId: string,
    id: string,
    body: PatchDeliveryRegionBody
  ) =>
    botFetch<DeliveryRegion>(`/businesses/${businessId}/delivery/regions/${id}`, {
      method: "PATCH",
      body,
    }),

  deleteDeliveryRegion: (businessId: string, id: string) =>
    botFetch<void>(`/businesses/${businessId}/delivery/regions/${id}`, {
      method: "DELETE",
    }),

  seedDeliveryCommunes: (businessId: string, regionId: string) =>
    botFetch<SeedDeliveryCommunesResult>(
      `/businesses/${businessId}/delivery/regions/${regionId}/seed-communes`,
      { method: "POST" }
    ),

  patchDeliveryCommune: (
    businessId: string,
    regionId: string,
    communeId: string,
    body: PatchDeliveryCommuneBody
  ) =>
    botFetch<DeliveryRegion>(
      `/businesses/${businessId}/delivery/regions/${regionId}/communes/${communeId}`,
      { method: "PATCH", body }
    ),

  rebuildDeliveryIndex: (businessId: string) =>
    botFetch<{ documentId: string }>(
      `/businesses/${businessId}/delivery/reindex`,
      { method: "POST" }
    ),

  listCatalogProducts: (businessId: string) =>
    botFetch<CatalogProduct[]>(`/businesses/${businessId}/catalog/products`),

  importCatalogCsv: (businessId: string, csvText: string) =>
    botFetch<ImportResult>(`/businesses/${businessId}/catalog/import/csv`, {
      method: "POST",
      body: { csv_text: csvText },
    }),

  importCatalogJson: (businessId: string, products: unknown) =>
    botFetch<ImportResult>(`/businesses/${businessId}/catalog/import/json`, {
      method: "POST",
      body: products,
    }),

  connectShopify: (
    businessId: string,
    body: { shop_domain: string; access_token: string }
  ) =>
    botFetch<{ connected: boolean; provider: string }>(
      `/businesses/${businessId}/integrations/shopify`,
      { method: "POST", body }
    ),

  getShopifyIntegration: (businessId: string) =>
    botFetch<ShopifyIntegration>(`/businesses/${businessId}/integrations/shopify`),

  syncShopify: (businessId: string) =>
    botFetch<ImportResult>(`/businesses/${businessId}/integrations/shopify/sync`, {
      method: "POST",
    }),

  patchConversationMode: (
    id: string,
    body: { mode: "BOT" | "HUMAN"; bot_resume_at?: string }
  ) => botFetch(`/conversations/${id}/mode`, { method: "PATCH", body }),

  sendConversationMessage: (
    conversationId: string,
    body: { text: string; agent_phone?: string; reply_to_message_id?: string }
  ) =>
    botFetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body,
    }),

  sendConversationInteractiveMessage: (
    conversationId: string,
    body: {
      interactive: Record<string, unknown>;
      agent_phone?: string;
      reply_to_message_id?: string;
    }
  ) =>
    botFetch(`/conversations/${conversationId}/messages/interactive`, {
      method: "POST",
      body,
    }),

  sendConversationMediaMessage: (conversationId: string, formData: FormData) =>
    botFetchMultipart<Record<string, unknown>>(
      `/conversations/${conversationId}/messages/media`,
      formData
    ),

  getMessageMediaUrl: (messageId: string, expiresIn = 3600) =>
    botFetch<MessageMediaUrlResponse>(`/messages/${messageId}/media-url`, {
      searchParams: { expires_in: expiresIn },
    }),

  streamMessageMediaFile: (messageId: string) =>
    botFetchRaw(`/messages/${messageId}/media/file`),

  createAgent: (
    businessId: string,
    body: {
      name: string;
      phone: string;
      role?: string;
      notify_on_handoff?: boolean;
      is_primary?: boolean;
    }
  ) => botFetch(`/businesses/${businessId}/agents`, { method: "POST", body }),

  patchAgent: (
    id: string,
    body: Partial<{
      name: string;
      phone: string;
      role: string;
      notify_on_handoff: boolean;
      active: boolean;
    }>
  ) => botFetch(`/agents/${id}`, { method: "PATCH", body }),

  getMetricsSummary: (businessId: string, from?: string, to?: string) =>
    botFetch(`/businesses/${businessId}/metrics/summary`, {
      searchParams: { from, to },
    }),

  getMetricsDashboard: (
    businessId: string,
    params?: { from?: string; to?: string; limit?: number }
  ) =>
    botFetch<{
      summary: MetricsSummary;
      top_questions: TopQuestion[];
      usage: Array<{ eventType: string; createdAt: string }>;
    }>(`/businesses/${businessId}/metrics/dashboard`, {
      searchParams: params,
    }),

  getMetricsQuestions: (
    businessId: string,
    params?: { from?: string; to?: string; limit?: number }
  ) =>
    botFetch(`/businesses/${businessId}/metrics/questions`, {
      searchParams: params,
    }),

  getMetricsUsage: (businessId: string, from?: string, to?: string) =>
    botFetch(`/businesses/${businessId}/metrics/usage`, {
      searchParams: { from, to },
    }),

  listChatImports: (
    businessId: string,
    params?: { page?: number; limit?: number }
  ) =>
    botFetch<PaginatedImportJobs>(`/businesses/${businessId}/chat-imports`, {
      searchParams: params,
    }),

  listPendingFaqSuggestions: (businessId: string) =>
    botFetch<PendingFaqSuggestion[]>(
      `/businesses/${businessId}/faq-suggestions/pending`
    ),

  getConsolidatedToneAnalysis: (businessId: string, useAi = false) =>
    botFetch<ConsolidatedToneAnalysis>(
      `/businesses/${businessId}/tone-analysis/consolidated`,
      { searchParams: { ai: useAi ? "true" : "false" } }
    ),

  approveConsolidatedToneAnalysis: (
    businessId: string,
    body?: ApproveToneBody
  ) =>
    botFetch<{
      status: string;
      tone_summary: string;
      recommended_bot_rules: Record<string, unknown>;
      source_import_jobs: Array<{ id: string; filename: string | null }>;
    }>(`/businesses/${businessId}/tone-analysis/consolidated/approve`, {
      method: "PATCH",
      body: body ?? {},
    }),

  uploadChatImport: (
    businessId: string,
    file: File | Blob,
    businessSenderName?: string
  ) => {
    const form = new FormData();
    form.append("file", file);
    if (businessSenderName) {
      form.append("business_sender_name", businessSenderName);
    }
    return botFetchMultipart<ChatImportUploadResult>(
      `/businesses/${businessId}/chat-imports`,
      form
    );
  },

  getChatImportJob: (businessId: string, importJobId: string) =>
    botFetch<ImportJob>(
      `/businesses/${businessId}/chat-imports/${importJobId}`
    ),

  deleteChatImport: (businessId: string, importJobId: string) =>
    botFetch<{ deleted: boolean }>(
      `/businesses/${businessId}/chat-imports/${importJobId}`,
      { method: "DELETE" }
    ),

  resetAllChatImports: (
    businessId: string,
    body?: { remove_approved_faqs?: boolean }
  ) =>
    botFetch<{
      deleted_jobs: number;
      deleted_faqs: number;
      tone_reset: boolean;
    }>(`/businesses/${businessId}/chat-imports/reset`, {
      method: "POST",
      body: body ?? {},
    }),

  getChatImportMessages: (
    businessId: string,
    importJobId: string,
    params?: {
      sender_role?: "customer" | "business";
      is_question?: boolean;
      limit?: number;
      page?: number;
    }
  ) =>
    botFetch<PaginatedMessages>(
      `/businesses/${businessId}/chat-imports/${importJobId}/messages`,
      {
        searchParams: {
          sender_role: params?.sender_role,
          is_question: params?.is_question === true ? "true" : undefined,
          limit: params?.limit,
          page: params?.page,
        },
      }
    ),

  getChatImportToneAnalysis: (businessId: string, importJobId: string) =>
    botFetch<ToneAnalysis>(
      `/businesses/${businessId}/chat-imports/${importJobId}/tone-analysis`
    ),

  getChatImportFaqSuggestions: (businessId: string, importJobId: string) =>
    botFetch<FaqSuggestion[]>(
      `/businesses/${businessId}/chat-imports/${importJobId}/faq-suggestions`
    ),

  approveToneAnalysis: (
    businessId: string,
    toneAnalysisId: string,
    body?: ApproveToneBody
  ) =>
    botFetch<ToneAnalysis>(
      `/businesses/${businessId}/tone-analysis/${toneAnalysisId}/approve`,
      { method: "PATCH", body: body ?? {} }
    ),

  editFaqSuggestion: (
    businessId: string,
    suggestionId: string,
    body: EditFaqSuggestionBody
  ) =>
    botFetch<FaqSuggestion>(
      `/businesses/${businessId}/faq-suggestions/${suggestionId}`,
      { method: "PATCH", body }
    ),

  approveFaqSuggestion: (
    businessId: string,
    suggestionId: string,
    body?: ApproveFaqSuggestionBody
  ) =>
    botFetch<FaqSuggestion>(
      `/businesses/${businessId}/faq-suggestions/${suggestionId}/approve`,
      { method: "PATCH", body: body ?? {} }
    ),

  rejectFaqSuggestion: (businessId: string, suggestionId: string) =>
    botFetch<{ status: string }>(
      `/businesses/${businessId}/faq-suggestions/${suggestionId}/reject`,
      { method: "PATCH" }
    ),

  resendMessage: (messageId: string) =>
    botFetch<{
      id: string;
      conversation_id: string;
      external_id: string | null;
      whatsapp_delivery_status: string | null;
      content_text: string;
      created_at: string;
    }>(`/messages/${messageId}/resend`, { method: "POST" }),

  editMessage: (messageId: string, body: { text: string }) =>
    botFetch<{
      id: string;
      conversation_id: string;
      external_id: string | null;
      whatsapp_delivery_status: string | null;
      content_text: string;
      created_at: string;
    }>(`/messages/${messageId}`, { method: "PATCH", body }),

  getCustomer: (businessId: string, customerId: string) =>
    botFetch<import("@/types/database.types").Customer>(
      `/businesses/${businessId}/customers/${customerId}`
    ),

  patchCustomer: (
    businessId: string,
    customerId: string,
    body: import("./types").CustomerProfilePatch
  ) =>
    botFetch<import("@/types/database.types").Customer>(
      `/businesses/${businessId}/customers/${customerId}`,
      { method: "PATCH", body }
    ),

  getConversation: (conversationId: string) =>
    botFetch<
      import("@/types/database.types").Conversation & {
        flow_mode_locked: boolean;
        active_flow_run: import("./types").ActiveFlowRunDetail | null;
      }
    >(`/conversations/${conversationId}`),

  listFlows: (businessId: string, status?: string) =>
    botFetch<FlowDefinition[]>(`/businesses/${businessId}/flows`, {
      searchParams: { status },
    }),

  startConversationFlow: (
    businessId: string,
    conversationId: string,
    flowId: string,
    body?: { started_by_admin_id?: string; version_id?: string }
  ) =>
    botFetch<FlowRunResult>(
      `/businesses/${businessId}/conversations/${conversationId}/flows/${flowId}/start`,
      { method: "POST", body: body ?? {} }
    ),

  createFlow: (
    businessId: string,
    body: {
      name: string;
      description?: string;
      created_by_admin_id: string;
      template?: "default" | "wood_quote";
    }
  ) =>
    botFetch<FlowDefinition>(`/businesses/${businessId}/flows`, {
      method: "POST",
      body,
    }),

  getFlow: (businessId: string, flowId: string) =>
    botFetch<FlowDefinition>(`/businesses/${businessId}/flows/${flowId}`),

  patchFlow: (
    businessId: string,
    flowId: string,
    body: {
      name?: string;
      description?: string | null;
      status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
      updated_by_admin_id: string;
    }
  ) =>
    botFetch<FlowDefinition>(`/businesses/${businessId}/flows/${flowId}`, {
      method: "PATCH",
      body,
    }),

  deleteFlow: (businessId: string, flowId: string, updatedByAdminId: string) =>
    botFetch<{ archived: boolean; flow: FlowDefinition } | void>(
      `/businesses/${businessId}/flows/${flowId}`,
      {
        method: "DELETE",
        body: { updated_by_admin_id: updatedByAdminId },
      }
    ),

  listFlowVersions: (businessId: string, flowId: string) =>
    botFetch<FlowVersion[]>(`/businesses/${businessId}/flows/${flowId}/versions`),

  getFlowVersion: (businessId: string, flowId: string, versionId: string) =>
    botFetch<FlowVersion>(
      `/businesses/${businessId}/flows/${flowId}/versions/${versionId}`
    ),

  updateFlowVersion: (
    businessId: string,
    flowId: string,
    versionId: string,
    body: {
      graph_json: unknown;
      updated_by_admin_id: string;
    }
  ) =>
    botFetch<FlowVersion>(
      `/businesses/${businessId}/flows/${flowId}/versions/${versionId}`,
      { method: "PATCH", body }
    ),

  createFlowVersion: (
    businessId: string,
    flowId: string,
    body: {
      created_by_admin_id: string;
      source_version_id?: string;
    }
  ) =>
    botFetch<FlowVersion>(`/businesses/${businessId}/flows/${flowId}/versions`, {
      method: "POST",
      body,
    }),

  publishFlowVersion: (
    businessId: string,
    flowId: string,
    versionId: string,
    body: { published_by_admin_id: string }
  ) =>
    botFetch<FlowDefinition>(
      `/businesses/${businessId}/flows/${flowId}/versions/${versionId}/publish`,
      { method: "POST", body }
    ),

  simulateFlow: (
    businessId: string,
    flowId: string,
    body: {
      messages: Array<{
        role: "customer" | "agent" | "system";
        content: string;
        created_at?: string;
      }>;
      version_id?: string;
      use_ai?: boolean;
    }
  ) =>
    botFetch<FlowSimulationResult>(
      `/businesses/${businessId}/flows/${flowId}/simulate`,
      { method: "POST", body }
    ),

  getFlowRun: (businessId: string, runId: string) =>
    botFetch<FlowRunDetail>(`/businesses/${businessId}/flow-runs/${runId}`),

  cancelFlowRun: (businessId: string, runId: string) =>
    botFetch<FlowRunResult>(`/businesses/${businessId}/flow-runs/${runId}/cancel`, {
      method: "POST",
    }),

  submitFlowRunAgentInput: (
    businessId: string,
    runId: string,
    body: { values: Record<string, unknown>; submitted_by_admin_id: string }
  ) =>
    botFetch<FlowRunResult>(
      `/businesses/${businessId}/flow-runs/${runId}/agent-input`,
      { method: "POST", body }
    ),

  listFlowReviews: (businessId: string, status = "PENDING") =>
    botFetch<FlowReview[]>(`/businesses/${businessId}/flow-reviews`, {
      searchParams: { status },
    }),

  resolveFlowReview: (
    businessId: string,
    reviewId: string,
    body: {
      status: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
      notes?: string;
      reviewer_admin_id: string;
    }
  ) =>
    botFetch<FlowRunResult>(
      `/businesses/${businessId}/flow-reviews/${reviewId}/resolve`,
      { method: "POST", body }
    ),

  getFlowFileSignedUrl: (businessId: string, fileId: string, expiresIn = 3600) =>
    botFetch<SignedUrlResponse>(
      `/businesses/${businessId}/flow-files/${fileId}/signed-url`,
      { searchParams: { expires_in: expiresIn } }
    ),

  getFlowWebhookIntegration: (businessId: string) =>
    botFetch<FlowWebhookIntegration>(
      `/businesses/${businessId}/integrations/flow-webhook`
    ),

  upsertFlowWebhookIntegration: (
    businessId: string,
    body: {
      url: string;
      enabled?: boolean;
      events?: string[];
      rotate_secret?: boolean;
    }
  ) =>
    botFetch<FlowWebhookIntegration & { webhook_secret?: string }>(
      `/businesses/${businessId}/integrations/flow-webhook`,
      { method: "PUT", body }
    ),

  listFlowWebhookDeliveries: (
    businessId: string,
    query?: { status?: string; flow_run_id?: string; limit?: number }
  ) =>
    botFetch<FlowWebhookDelivery[]>(
      `/businesses/${businessId}/flow-webhook-deliveries`,
      { searchParams: query }
    ),

  retryFlowWebhookDelivery: (businessId: string, deliveryId: string) =>
    botFetch<FlowWebhookDelivery>(
      `/businesses/${businessId}/flow-webhook-deliveries/${deliveryId}/retry`,
      { method: "POST" }
    ),

  getSetupStatus: (businessId: string) =>
    botFetch<import("@/features/onboarding/types").SetupStatus>(
      `/businesses/${businessId}/setup-status`
    ),

  patchOnboarding: (
    businessId: string,
    body: import("@/features/onboarding/types").OnboardingPatch
  ) =>
    botFetch<import("@/features/onboarding/types").SetupStatus>(
      `/businesses/${businessId}/onboarding`,
      { method: "PATCH", body }
    ),

  completeOnboarding: (
    businessId: string,
    body: import("@/features/onboarding/types").CompleteOnboardingBody
  ) =>
    botFetch<{ success: boolean }>(`/businesses/${businessId}/onboarding/complete`, {
      method: "POST",
      body,
    }),

  completeWhatsappEmbeddedSignup: (body: EmbeddedSignupCompleteBody) =>
    botFetch<EmbeddedSignupCompleteResponse>("/whatsapp/embedded-signup/complete", {
      method: "POST",
      body,
    }),

  getWhatsappConnection: async (businessId: string) => {
    try {
      return await botFetch<WhatsappConnection>(
        `/businesses/${businessId}/whatsapp/connection`
      );
    } catch (error) {
      if (error instanceof BotApiError && error.status === 404) {
        return { connected: false, status: "disconnected" as const };
      }
      throw error;
    }
  },
};

export function getCachedFaqs(businessId: string) {
  return unstable_cache(
    () => botApi.listFaqs(businessId),
    [`faqs-${businessId}`],
    { revalidate: 60, tags: [`faqs-${businessId}`] }
  )();
}

export function faqsCacheTag(businessId: string) {
  return `faqs-${businessId}`;
}

export { BotApiError };
