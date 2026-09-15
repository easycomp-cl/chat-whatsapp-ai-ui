import { requireBusinessAdmin } from "@/lib/auth/session";
import { getBusinessById } from "@/lib/business/get-business";
import { createClient } from "@/lib/supabase/server";
import { botApi } from "@/lib/bot-api/client";
import type { WhatsappTemplate } from "@/lib/bot-api/types";
import type { TemplatePreviewContext } from "../utils";
import { TemplatesManager } from "./templates-manager";

function firstNameOf(value?: string | null): string {
  return value?.trim().split(/\s+/)[0] ?? "";
}

function formatMoney(price: number | null | undefined, currency?: string | null): string | null {
  if (price == null || Number.isNaN(price)) return null;
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency || "CLP",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price}`;
  }
}

async function loadPreviewContext(
  businessId: string,
  profile: {
    first_name?: string | null;
    full_name: string | null;
  }
): Promise<TemplatePreviewContext> {
  const business = await getBusinessById(businessId);
  const timeZone = business?.timezone?.trim() || "America/Santiago";
  const now = new Date();
  const appointmentDate = new Intl.DateTimeFormat("es-CL", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
  const appointmentTime = new Intl.DateTimeFormat("es-CL", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const supabase = await createClient();
  const [{ data: customers }, products] = await Promise.all([
    supabase
      .from("customers")
      .select("name, display_alias")
      .eq("business_id", businessId)
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .limit(30),
    botApi.listCatalogProducts(businessId).catch(() => []),
  ]);

  const customerRow = (customers ?? []).find((row) => {
    const label = (row.display_alias ?? row.name)?.trim();
    return Boolean(label);
  });
  const customerName =
    firstNameOf(customerRow?.display_alias) ||
    firstNameOf(customerRow?.name) ||
    firstNameOf(profile.first_name) ||
    firstNameOf(profile.full_name) ||
    "Cliente";

  const product = products.find((item) => item.isActive) ?? products[0] ?? null;
  const productName = product?.name?.trim() || "tu producto";
  const productDetail =
    [product?.description?.trim(), formatMoney(product?.price, product?.currency)]
      .filter(Boolean)
      .join(" · ") || "consulta el detalle con nosotros";
  const orderRef = product?.sku?.trim() ? `#${product.sku.trim()}` : "#1";

  return {
    businessName: business?.name?.trim() || "Tu negocio",
    userFirstName:
      firstNameOf(profile.first_name) || firstNameOf(profile.full_name) || "Tú",
    customerName,
    productName,
    productDetail,
    orderRef,
    appointmentDate,
    appointmentTime,
  };
}

export async function TemplatesPageContent() {
  const profile = await requireBusinessAdmin();
  const businessId = profile.business_id!;

  let templates: WhatsappTemplate[] = [];
  let whatsappConnected = false;

  try {
    const connection = await botApi.getWhatsappConnection(businessId);
    whatsappConnected = Boolean(connection.connected);
  } catch {
    whatsappConnected = false;
  }

  try {
    const listed = await botApi.listWhatsappTemplates(businessId);
    templates = listed.templates ?? [];
    if (typeof listed.connected === "boolean") {
      whatsappConnected = listed.connected;
    }
  } catch {
    templates = [];
  }

  const previewContext = await loadPreviewContext(businessId, profile);

  return (
    <TemplatesManager
      templates={templates}
      whatsappConnected={whatsappConnected}
      previewContext={previewContext}
    />
  );
}
