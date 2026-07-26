import { requireBusinessAdmin } from "@/lib/auth/session";
import { getCachedFaqs } from "@/lib/bot-api/client";
import { FaqsManager } from "@/features/faqs/components/faqs-manager";
import type { Faq } from "@/lib/bot-api/types";

export async function FaqsPageContent() {
  const profile = await requireBusinessAdmin();
  let faqs: Faq[] = [];

  try {
    faqs = await getCachedFaqs(profile.business_id!);
  } catch {
    faqs = [];
  }

  return <FaqsManager faqs={faqs} />;
}
