import { requireBusinessAdmin } from "@/lib/auth/session";
import { getBusinessById } from "@/lib/business/get-business";
import { botApi } from "@/lib/bot-api/client";
import { getWhatsappConnectionAction } from "@/lib/actions/whatsapp-onboarding-actions";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { WhatsappConnectionCard } from "@/features/whatsapp-onboarding/components/whatsapp-connection-card";
import type { BotPersonality, KnowledgeSettings } from "@/lib/bot-api/types";

export async function SettingsPageContent() {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  const [business, businessApi, botPersonality, whatsapp] = await Promise.all([
    getBusinessById(businessId),
    botApi
      .getBusiness(businessId)
      .then((data) => data as {
        knowledge?: KnowledgeSettings;
        config?: { knowledge?: KnowledgeSettings };
      })
      .catch(() => null),
    botApi.getBotPersonality(businessId).catch(() => null),
    getWhatsappConnectionAction(),
  ]);

  if (!business) return <p>No se encontró el negocio</p>;

  const knowledge =
    businessApi?.knowledge ?? businessApi?.config?.knowledge ?? undefined;

  return (
    <div className="space-y-4">
      <WhatsappConnectionCard
        connected={Boolean(whatsapp?.connected)}
        phoneNumber={whatsapp?.phone_number}
        phoneNumberId={whatsapp?.phone_number_id}
      />
      <SettingsForm
        business={business}
        knowledge={knowledge}
        botPersonality={botPersonality as BotPersonality | null}
      />
    </div>
  );
}
