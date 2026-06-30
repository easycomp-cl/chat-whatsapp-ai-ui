import { requireBusinessAdmin } from "@/lib/auth/session";
import { botApi } from "@/lib/bot-api/client";
import { CatalogManager } from "@/features/catalog/components/catalog-manager";
import type { CatalogProduct } from "@/lib/bot-api/types";

export default async function CatalogPage() {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  let products: CatalogProduct[] = [];

  try {
    products = await botApi.listCatalogProducts(businessId);
  } catch {
    products = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Catálogo de productos</h2>
        <p className="text-muted-foreground">
          Importa productos desde CSV o JSON
        </p>
      </div>
      <CatalogManager products={products} />
    </div>
  );
}
