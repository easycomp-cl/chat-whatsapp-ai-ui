import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi, getBotApiErrorMessage } from "@/lib/bot-api/client";
import { FlowsManager } from "@/features/flows/components/flows-manager";
import type { FlowDefinition } from "@/lib/bot-api/types";

export async function FlowsPageContent() {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  let flows: FlowDefinition[] = [];
  let apiError: string | null = null;

  try {
    flows = await botApi.listFlows(businessId);
  } catch (error) {
    apiError = getBotApiErrorMessage(error);
  }

  return <FlowsManager flows={flows} apiError={apiError} />;
}
