"use server";

import { revalidatePath } from "next/cache";
import { botApi, BotApiError, BOT_API_UNAVAILABLE_MESSAGE } from "@/lib/bot-api/client";
import { loadConversationsInbox } from "@/lib/conversations/load-conversations";
import {
  requireAppAccess,
  requireBusinessAdmin,
  requireProfile,
} from "@/lib/auth/session";
import type { ConversationFlowState } from "@/lib/bot-api/types";
import type {
  CreateFlowInput,
  FlowAgentInput,
  FlowWebhookIntegrationInput,
  ResolveFlowReviewInput,
  SimulateFlowInput,
} from "@/lib/validators/schemas";
import { resolveFlowAdminId } from "@/lib/flows/resolve-admin-id";

export async function fetchConversationsInboxAction(agentId?: string | null) {
  const profile = await requireAppAccess();
  return loadConversationsInbox(profile.business_id!, agentId);
}

export async function fetchConversationFlowStateAction(
  conversationId: string
): Promise<ConversationFlowState | null> {
  await requireAppAccess();
  try {
    const detail = await botApi.getConversation(conversationId);
    return {
      flow_mode_locked: detail.flow_mode_locked,
      active_flow_run: detail.active_flow_run,
    };
  } catch {
    return null;
  }
}

export async function listActivatableFlowsAction() {
  const profile = await requireAppAccess();
  try {
    const flows = await botApi.listFlows(profile.business_id!, "ACTIVE");
    return flows.filter(
      (flow) => flow.status === "ACTIVE" && flow.current_version_id != null
    );
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function startConversationFlowAction(conversationId: string, flowId: string) {
  const profile = await requireProfile();
  const adminId = await resolveFlowAdminId(profile);
  try {
    const result = await botApi.startConversationFlow(
      profile.business_id!,
      conversationId,
      flowId,
      { started_by_admin_id: adminId }
    );
    revalidatePath("/app/conversations");
    revalidatePath(`/app/conversations/${conversationId}`);
    return result;
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    if (error instanceof Error) throw error;
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function createFlowAction(data: CreateFlowInput) {
  const profile = await requireBusinessAdmin();
  const adminId = await resolveFlowAdminId(profile);
  try {
    const flow = await botApi.createFlow(profile.business_id!, {
      name: data.name,
      description: data.description,
      created_by_admin_id: adminId,
      template: data.template,
    });
    revalidatePath("/app/flujos");
    return flow;
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    if (error instanceof Error) throw error;
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function archiveFlowAction(flowId: string) {
  const profile = await requireBusinessAdmin();
  const adminId = await resolveFlowAdminId(profile);
  try {
    await botApi.deleteFlow(profile.business_id!, flowId, adminId);
    revalidatePath("/app/flujos");
    revalidatePath(`/app/flujos/${flowId}`);
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    if (error instanceof Error) throw error;
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function createFlowVersionFromSourceAction(flowId: string, sourceVersionId: string) {
  const profile = await requireBusinessAdmin();
  const adminId = await resolveFlowAdminId(profile);
  try {
    const version = await botApi.createFlowVersion(profile.business_id!, flowId, {
      created_by_admin_id: adminId,
      source_version_id: sourceVersionId,
    });
    revalidatePath(`/app/flujos/${flowId}`);
    return version;
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    if (error instanceof Error) throw error;
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function publishFlowVersionAction(flowId: string, versionId: string) {
  const profile = await requireBusinessAdmin();
  const adminId = await resolveFlowAdminId(profile);
  try {
    await botApi.publishFlowVersion(profile.business_id!, flowId, versionId, {
      published_by_admin_id: adminId,
    });
    revalidatePath("/app/flujos");
    revalidatePath(`/app/flujos/${flowId}`);
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function updateFlowVersionAction(
  flowId: string,
  versionId: string,
  graph: Record<string, unknown>
) {
  const profile = await requireBusinessAdmin();
  const adminId = await resolveFlowAdminId(profile);
  try {
    const version = await botApi.updateFlowVersion(profile.business_id!, flowId, versionId, {
      graph_json: graph,
      updated_by_admin_id: adminId,
    });
    revalidatePath(`/app/flujos/${flowId}`);
    return version;
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    if (error instanceof Error) throw error;
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function simulateFlowAction(
  flowId: string,
  data: SimulateFlowInput
) {
  const profile = await requireBusinessAdmin();
  try {
    return await botApi.simulateFlow(profile.business_id!, flowId, {
      messages: data.messages,
      ...(data.version_id ? { version_id: data.version_id } : {}),
      ...(data.use_ai ? { use_ai: true } : {}),
    });
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    if (error instanceof Error) throw error;
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function upsertFlowWebhookIntegrationAction(
  data: FlowWebhookIntegrationInput
) {
  const profile = await requireBusinessAdmin();
  try {
    const result = await botApi.upsertFlowWebhookIntegration(profile.business_id!, {
      url: data.url,
      enabled: data.enabled,
      events: data.events,
      rotate_secret: data.rotate_secret,
    });
    revalidatePath(`/app/flujos`);
    return result;
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function retryFlowWebhookDeliveryAction(deliveryId: string) {
  const profile = await requireBusinessAdmin();
  try {
    const delivery = await botApi.retryFlowWebhookDelivery(
      profile.business_id!,
      deliveryId
    );
    revalidatePath("/app/flujos");
    return delivery;
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function resolveFlowReviewAction(
  reviewId: string,
  data: ResolveFlowReviewInput
) {
  const profile = await requireProfile();
  const adminId = await resolveFlowAdminId(profile);
  try {
    const result = await botApi.resolveFlowReview(profile.business_id!, reviewId, {
      status: data.status,
      notes: data.notes,
      reviewer_admin_id: adminId,
    });
    revalidatePath("/app/flujos/revisiones");
    revalidatePath("/app/conversations");
    return result;
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function submitFlowAgentInputAction(
  runId: string,
  data: FlowAgentInput
) {
  const profile = await requireProfile();
  const adminId = await resolveFlowAdminId(profile);
  try {
    const result = await botApi.submitFlowRunAgentInput(profile.business_id!, runId, {
      values: data.values,
      submitted_by_admin_id: adminId,
    });
    revalidatePath("/app/conversations");
    return result;
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}

export async function cancelFlowRunAction(runId: string) {
  const profile = await requireProfile();
  try {
    const result = await botApi.cancelFlowRun(profile.business_id!, runId);
    revalidatePath("/app/conversations");
    revalidatePath("/app/flujos");
    return result;
  } catch (error) {
    if (error instanceof BotApiError) throw new Error(error.message);
    throw new Error(BOT_API_UNAVAILABLE_MESSAGE);
  }
}
