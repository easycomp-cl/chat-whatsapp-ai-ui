import "server-only";
import type {
  ApproveFaqSuggestionBody,
  ApproveToneBody,
  BusinessSettings,
  CatalogProduct,
  ChatImportUploadResult,
  ConsolidatedToneAnalysis,
  CreateFaqBody,
  CreateKnowledgeBody,
  EditFaqSuggestionBody,
  Faq,
  FaqSuggestion,
  ImportJob,
  ImportResult,
  ImportedMessage,
  KnowledgeDocument,
  KnowledgeDocumentDetail,
  KnowledgeSettingsInput,
  PaginatedImportJobs,
  PaginatedMessages,
  PendingFaqSuggestion,
  ShopifyIntegration,
  ToneAnalysis,
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
  const url = process.env.BOT_API_BASE_URL;
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

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? res.statusText;
  } catch {
    const text = await res.text();
    return text || res.statusText;
  }
}

function connectionErrorMessage(baseUrl: string): string {
  return `No se pudo conectar con el backend (${baseUrl}). Verifica que chat-whatsapp-ai esté en ejecución (npm run dev en el puerto 3000).`;
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
  return res.json() as Promise<T>;
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

  createFaq: (businessId: string, body: CreateFaqBody) =>
    botFetch<Faq>(`/businesses/${businessId}/faqs`, { method: "POST", body }),

  patchFaq: (businessId: string, id: string, body: Partial<CreateFaqBody>) =>
    botFetch<Faq>(`/businesses/${businessId}/faqs/${id}`, { method: "PATCH", body }),

  deleteFaq: (businessId: string, id: string) =>
    botFetch<void>(`/businesses/${businessId}/faqs/${id}`, { method: "DELETE" }),

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

  getConsolidatedToneAnalysis: (businessId: string, useAi = true) =>
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
};

export { BotApiError };
