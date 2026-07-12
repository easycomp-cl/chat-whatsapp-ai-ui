import { requireBusinessAdmin } from "@/lib/auth/session";
import { getBusinessById } from "@/lib/business/get-business";
import { botApi } from "@/lib/bot-api/client";
import { SettingsForm } from "@/features/settings/components/settings-form";
import type { KnowledgeSettings } from "@/lib/bot-api/types";

export async function SettingsPageContent() {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  const [business, businessApi] = await Promise.all([
    getBusinessById(businessId),
    botApi
      .getBusiness(businessId)
      .then((data) => data as {
        knowledge?: KnowledgeSettings;
        config?: { knowledge?: KnowledgeSettings };
      })
      .catch(() => null),
  ]);

  if (!business) return <p>No se encontró el negocio</p>;

  const knowledge =
    businessApi?.knowledge ?? businessApi?.config?.knowledge ?? undefined;

  return <SettingsForm business={business} knowledge={knowledge} />;
}
