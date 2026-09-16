"use server";

import { confirmPublicPhoneVerification } from "@/lib/bot-api/public-verify";

export async function confirmPhoneVerificationAction(token: string) {
  return confirmPublicPhoneVerification(token);
}
