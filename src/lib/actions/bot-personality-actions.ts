"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi, getBotApiErrorMessage } from "@/lib/bot-api/client";
import type { BotPersonalityPatch } from "@/lib/bot-api/types";

export async function saveBotPersonalityAction(body: BotPersonalityPatch) {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  try {
    const result = await botApi.patchBotPersonality(businessId, body);
    revalidatePath("/app/settings");
    return { ok: true as const, data: result };
  } catch (error) {
    return { ok: false as const, error: getBotApiErrorMessage(error) };
  }
}
