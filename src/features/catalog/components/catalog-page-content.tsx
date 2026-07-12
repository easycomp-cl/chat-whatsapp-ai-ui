import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi } from "@/lib/bot-api/client";
import { CatalogManager } from "@/features/catalog/components/catalog-manager";
import type { CatalogProduct } from "@/lib/bot-api/types";

export async function CatalogPageContent() {
  const profile = await requireBusinessAdmin();
  let products: CatalogProduct[] = [];

  try {
    products = await botApi.listCatalogProducts(profile.business_id!);
  } catch {
    products = [];
  }

  return <CatalogManager products={products} />;
}
