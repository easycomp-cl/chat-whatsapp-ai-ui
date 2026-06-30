import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi } from "@/lib/bot-api/client";
import { FaqsManager } from "@/features/faqs/components/faqs-manager";
import type { Faq } from "@/lib/bot-api/types";

export default async function FaqsPage() {
  const profile = await requireBusinessAdmin();
  let faqs: Faq[] = [];

  try {
    faqs = await botApi.listFaqs(profile.business_id!);
  } catch {
    faqs = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Preguntas frecuentes</h2>
        <p className="text-muted-foreground">
          Administra respuestas automáticas con keywords y frases alternativas
        </p>
      </div>
      <FaqsManager faqs={faqs} />
    </div>
  );
}
