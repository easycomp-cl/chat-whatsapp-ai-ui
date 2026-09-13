import { redirect } from "next/navigation";
import { WHATSAPP_ONBOARDING_PATH } from "@/lib/meta/embedded-signup";

export default function OnboardingIndexPage() {
  redirect(WHATSAPP_ONBOARDING_PATH);
}
