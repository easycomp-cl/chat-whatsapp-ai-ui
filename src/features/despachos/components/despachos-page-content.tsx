import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi, getBotApiErrorMessage } from "@/lib/bot-api/client";
import { CHILE_REGION_NAMES } from "@/lib/delivery/chile-regions";
import { DespachosManager } from "@/features/despachos/components/despachos-manager";
import type { DeliveryRegion } from "@/lib/bot-api/types";

export async function DespachosPageContent() {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  let regions: DeliveryRegion[] = [];
  let chileRegions: string[] = [...CHILE_REGION_NAMES];
  let apiError: string | null = null;

  const [regionsResult, chileRegionsResult] = await Promise.all([
    botApi
      .listDeliveryRegions(businessId)
      .then((data) => ({ ok: true as const, data }))
      .catch((error) => ({ ok: false as const, error: getBotApiErrorMessage(error) })),
    botApi.listChileRegions().catch(() => null),
  ]);

  if (regionsResult.ok) {
    regions = regionsResult.data;
  } else {
    apiError = regionsResult.error;
  }

  if (chileRegionsResult && chileRegionsResult.length > 0) {
    chileRegions = chileRegionsResult;
  }

  return (
    <DespachosManager
      regions={regions}
      chileRegions={chileRegions}
      apiError={apiError}
    />
  );
}
