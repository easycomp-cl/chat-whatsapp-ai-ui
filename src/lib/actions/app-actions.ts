"use server";

import { revalidatePath } from "next/cache";
import { botApi, BotApiError } from "@/lib/bot-api/client";
import {
  requireAppAccess,
  requireBusinessAdmin,
  requireProfile,
  requireSuperAdmin,
} from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { patchTenantInDatabase } from "@/lib/business/patch-tenant";
import { patchConversationInDatabase } from "@/lib/conversation/patch-conversation";
import { parseCsvFaqs, parseJsonFaqs } from "@/lib/faqs/parse-faq-import";
import type {
  FaqInput,
  AgentInput,
  KnowledgeInput,
  SettingsInput,
  NoteInput,
  ReplyInput,
  ShopifyConnectInput,
} from "@/lib/validators/schemas";

export async function toggleBotGlobal(enabled: boolean) {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  // Fuente de verdad para el dashboard (Supabase local / compartida)
  await patchTenantInDatabase(businessId, { botGlobalEnabled: enabled });

  // Mantener sincronizado el runtime del bot si está levantado
  try {
    await botApi.patchBusinessSettings(businessId, {
      bot_global_enabled: enabled,
    });
  } catch {
    // Ignorar si el bot API no está disponible o usa otra DB
  }

  revalidatePath("/app/dashboard");
  revalidatePath("/app/settings");
}

export async function changeConversationMode(
  conversationId: string,
  mode: "BOT" | "HUMAN"
) {
  await requireProfile();

  await patchConversationInDatabase(conversationId, {
    mode,
    ...(mode === "BOT"
      ? {
          handoffReason: null,
          assignedAdminId: null,
          botResumeAt: null,
        }
      : {}),
  });

  try {
    await botApi.patchConversationMode(conversationId, { mode });
  } catch {
    // Bot API puede usar otra instancia; el dashboard ya quedó actualizado
  }

  revalidatePath("/app/conversations");
  revalidatePath(`/app/conversations/${conversationId}`);
}

export async function createFaqAction(data: FaqInput) {
  const profile = await requireBusinessAdmin();
  await botApi.createFaq(profile.business_id!, data);
  revalidatePath("/app/faqs");
}

export async function updateFaqAction(id: string, data: Partial<FaqInput>) {
  const profile = await requireBusinessAdmin();
  await botApi.patchFaq(profile.business_id!, id, data);
  revalidatePath("/app/faqs");
}

export async function deleteFaqAction(id: string) {
  const profile = await requireBusinessAdmin();
  await botApi.deleteFaq(profile.business_id!, id);
  revalidatePath("/app/faqs");
}

async function importFaqsBulk(faqs: ReturnType<typeof parseCsvFaqs>) {
  const profile = await requireBusinessAdmin();
  if (faqs.length === 0) {
    throw new Error("No se encontraron FAQs válidas (requieren pregunta y respuesta)");
  }

  let imported = 0;
  for (const faq of faqs) {
    try {
      await botApi.createFaq(profile.business_id!, faq);
      imported++;
    } catch {
      // continuar con las demás filas
    }
  }

  if (imported === 0) {
    throw new Error("Ninguna FAQ pudo importarse. Revisa el formato del archivo.");
  }

  revalidatePath("/app/faqs");
  return { imported, total: faqs.length, failed: faqs.length - imported };
}

export async function importFaqsCsvAction(csvText: string) {
  await requireBusinessAdmin();
  return importFaqsBulk(parseCsvFaqs(csvText));
}

export async function importFaqsJsonAction(jsonText: string) {
  await requireBusinessAdmin();
  let faqs: ReturnType<typeof parseJsonFaqs>;
  try {
    faqs = parseJsonFaqs(jsonText);
  } catch {
    throw new Error("JSON inválido");
  }
  return importFaqsBulk(faqs);
}

export async function createKnowledgeAction(data: KnowledgeInput) {
  const profile = await requireBusinessAdmin();
  await botApi.createKnowledgeDocument(profile.business_id!, data);
  revalidatePath("/app/knowledge");
}

export async function getKnowledgeDocumentAction(id: string) {
  const profile = await requireBusinessAdmin();
  return botApi.getKnowledgeDocument(profile.business_id!, id);
}

export async function uploadKnowledgeAction(formData: FormData) {
  const profile = await requireBusinessAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Archivo requerido");
  }
  const title = formData.get("title");
  await botApi.uploadKnowledgeDocument(
    profile.business_id!,
    file,
    typeof title === "string" && title ? title : undefined
  );
  revalidatePath("/app/knowledge");
}

export async function indexKnowledgeAction(id: string) {
  const profile = await requireBusinessAdmin();
  await botApi.indexKnowledgeDocument(profile.business_id!, id);
  revalidatePath("/app/knowledge");
}

export async function deleteKnowledgeAction(id: string) {
  const profile = await requireBusinessAdmin();
  await botApi.deleteKnowledgeDocument(profile.business_id!, id);
  revalidatePath("/app/knowledge");
}

export async function importCatalogCsvAction(csvText: string) {
  const profile = await requireBusinessAdmin();
  const result = await botApi.importCatalogCsv(profile.business_id!, csvText);
  revalidatePath("/app/catalog");
  revalidatePath("/app/knowledge");
  return result;
}

export async function importCatalogJsonAction(jsonText: string) {
  const profile = await requireBusinessAdmin();
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("JSON inválido");
  }
  const result = await botApi.importCatalogJson(profile.business_id!, parsed);
  revalidatePath("/app/catalog");
  revalidatePath("/app/knowledge");
  return result;
}

export async function connectShopifyAction(data: ShopifyConnectInput) {
  const profile = await requireBusinessAdmin();
  await botApi.connectShopify(profile.business_id!, data);
  revalidatePath("/app/catalog");
}

export async function syncShopifyAction() {
  const profile = await requireBusinessAdmin();
  const result = await botApi.syncShopify(profile.business_id!);
  revalidatePath("/app/catalog");
  revalidatePath("/app/knowledge");
  return result;
}

export async function createAgentAction(data: AgentInput) {
  const profile = await requireBusinessAdmin();
  await botApi.createAgent(profile.business_id!, {
    name: data.name,
    phone: data.phone,
    role: data.role,
    notify_on_handoff: data.notify_on_handoff,
  });
  revalidatePath("/app/agents");
}

export async function updateAgentAction(
  id: string,
  data: Partial<AgentInput>
) {
  await requireBusinessAdmin();
  await botApi.patchAgent(id, {
    name: data.name,
    phone: data.phone,
    role: data.role,
    notify_on_handoff: data.notify_on_handoff,
    active: data.active,
  });
  revalidatePath("/app/agents");
}

export async function saveSettingsAction(data: SettingsInput) {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  await patchTenantInDatabase(businessId, {
    botGlobalEnabled: data.bot_global_enabled,
    confidenceThreshold: data.confidence_threshold,
    defaultAiModel: data.default_ai_model,
  });

  try {
    await botApi.patchBusinessSettings(businessId, {
      bot_global_enabled: data.bot_global_enabled,
      confidence_threshold: data.confidence_threshold,
      default_ai_model: data.default_ai_model,
      ...(data.knowledge ? { knowledge: data.knowledge } : {}),
    });
  } catch {
    // Bot API opcional en dev
  }

  revalidatePath("/app/settings");
  revalidatePath("/app/dashboard");
}

export async function sendConversationReplyAction(
  conversationId: string,
  data: ReplyInput
) {
  const profile = await requireAppAccess();
  let agentPhone: string | undefined;

  if (profile.agent_id) {
    const supabase = await createClient();
    const { data: agent } = await supabase
      .from("business_agents")
      .select("phone")
      .eq("id", profile.agent_id)
      .single();
    agentPhone = agent?.phone ?? undefined;
  }

  try {
    const created = await botApi.sendConversationMessage(conversationId, {
      text: data.text,
      ...(agentPhone ? { agent_phone: agentPhone } : {}),
      ...(data.reply_to_message_id
        ? { reply_to_message_id: data.reply_to_message_id }
        : {}),
    });

    revalidatePath("/app/conversations");
    revalidatePath(`/app/conversations/${conversationId}`);

    return created as Record<string, unknown> | null;
  } catch (error) {
    if (error instanceof BotApiError) {
      if (error.message === "No active WhatsApp channel for this business") {
        throw new Error(
          "Este negocio no tiene un canal de WhatsApp activo. Actívalo en configuración o contacta al administrador."
        );
      }
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function addConversationNoteAction(
  conversationId: string,
  data: NoteInput
) {
  const profile = await requireAppAccess();
  const supabase = await createClient();
  const { error } = await supabase.from("conversation_notes").insert({
    business_id: profile.business_id!,
    conversation_id: conversationId,
    user_id: profile.user_id,
    note: data.note,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/conversations/${conversationId}`);
}

export async function clearConversationChatAction(conversationId: string) {
  const profile = await requireBusinessAdmin();

  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, business_id")
    .eq("id", conversationId)
    .eq("business_id", profile.business_id!)
    .single();

  if (!conversation) {
    throw new Error("Conversación no encontrada");
  }

  await patchConversationInDatabase(conversationId, {
    chatClearedAt: new Date().toISOString(),
  });

  revalidatePath("/app/conversations");
  revalidatePath(`/app/conversations/${conversationId}`);
}

export async function activateProfileAction(
  profileId: string,
  businessId: string,
  role: "BUSINESS_ADMIN" | "AGENT",
  agentId?: string
) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      business_id: businessId,
      role,
      agent_id: agentId ?? null,
      active: true,
    })
    .eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/businesses");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
