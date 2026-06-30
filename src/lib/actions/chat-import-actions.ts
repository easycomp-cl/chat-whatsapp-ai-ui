"use server";

import { revalidatePath } from "next/cache";
import { botApi, BotApiError } from "@/lib/bot-api/client";
import type {
  ApproveFaqSuggestionBody,
  ApproveToneBody,
  EditFaqSuggestionBody,
} from "@/lib/bot-api/types";
import { requireBusinessAdmin } from "@/lib/auth/session";

function revalidateChatImportPaths(jobId?: string) {
  revalidatePath("/app/importar-chat");
  if (jobId) revalidatePath(`/app/importar-chat/${jobId}`);
  revalidatePath("/app/faqs");
  revalidatePath("/app/settings");
}

export async function uploadChatImportAction(formData: FormData) {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Archivo requerido");
  }
  const senderName = formData.get("business_sender_name");
  const result = await botApi.uploadChatImport(
    businessId,
    file,
    typeof senderName === "string" && senderName.trim()
      ? senderName.trim()
      : undefined
  );
  revalidateChatImportPaths(result.import_job_id);
  return result;
}

export async function listChatImportsAction(params?: {
  page?: number;
  limit?: number;
}) {
  const profile = await requireBusinessAdmin();
  return botApi.listChatImports(profile.business_id!, params);
}

export async function getChatImportJobAction(importJobId: string) {
  const profile = await requireBusinessAdmin();
  return botApi.getChatImportJob(profile.business_id!, importJobId);
}

export async function deleteChatImportAction(importJobId: string) {
  const profile = await requireBusinessAdmin();
  await botApi.deleteChatImport(profile.business_id!, importJobId);
  revalidateChatImportPaths(importJobId);
}

export async function resetAllChatImportsAction(options?: {
  remove_approved_faqs?: boolean;
}) {
  const profile = await requireBusinessAdmin();
  const result = await botApi.resetAllChatImports(profile.business_id!, options);
  revalidateChatImportPaths();
  return result;
}

export async function listPendingFaqSuggestionsAction() {
  const profile = await requireBusinessAdmin();
  return botApi.listPendingFaqSuggestions(profile.business_id!);
}

export async function getConsolidatedToneAction(useAi = true) {
  const profile = await requireBusinessAdmin();
  try {
    return await botApi.getConsolidatedToneAnalysis(profile.business_id!, useAi);
  } catch (error) {
    if (error instanceof BotApiError && error.status === 404) return null;
    throw error;
  }
}

export async function approveConsolidatedToneAction(body?: ApproveToneBody) {
  const profile = await requireBusinessAdmin();
  const result = await botApi.approveConsolidatedToneAnalysis(
    profile.business_id!,
    body
  );
  revalidateChatImportPaths();
  return result;
}

export async function getChatImportToneAction(importJobId: string) {
  const profile = await requireBusinessAdmin();
  try {
    return await botApi.getChatImportToneAnalysis(
      profile.business_id!,
      importJobId
    );
  } catch (error) {
    if (error instanceof BotApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getChatImportFaqSuggestionsAction(importJobId: string) {
  const profile = await requireBusinessAdmin();
  return botApi.getChatImportFaqSuggestions(
    profile.business_id!,
    importJobId
  );
}

export async function getChatImportMessagesAction(
  importJobId: string,
  params?: {
    sender_role?: "customer" | "business";
    is_question?: boolean;
    limit?: number;
    page?: number;
  }
) {
  const profile = await requireBusinessAdmin();
  return botApi.getChatImportMessages(profile.business_id!, importJobId, params);
}

export async function approveToneAnalysisAction(
  toneAnalysisId: string,
  importJobId: string,
  body?: ApproveToneBody
) {
  const profile = await requireBusinessAdmin();
  const result = await botApi.approveToneAnalysis(
    profile.business_id!,
    toneAnalysisId,
    body
  );
  revalidateChatImportPaths(importJobId);
  return result;
}

export async function editFaqSuggestionAction(
  suggestionId: string,
  importJobId: string,
  body: EditFaqSuggestionBody
) {
  const profile = await requireBusinessAdmin();
  const result = await botApi.editFaqSuggestion(
    profile.business_id!,
    suggestionId,
    body
  );
  revalidateChatImportPaths(importJobId);
  return result;
}

export async function approveFaqSuggestionAction(
  suggestionId: string,
  importJobId: string,
  body?: ApproveFaqSuggestionBody
) {
  const profile = await requireBusinessAdmin();
  const result = await botApi.approveFaqSuggestion(
    profile.business_id!,
    suggestionId,
    body
  );
  revalidateChatImportPaths(importJobId);
  return result;
}

export async function rejectFaqSuggestionAction(
  suggestionId: string,
  importJobId: string
) {
  const profile = await requireBusinessAdmin();
  const result = await botApi.rejectFaqSuggestion(
    profile.business_id!,
    suggestionId
  );
  revalidateChatImportPaths(importJobId);
  return result;
}
