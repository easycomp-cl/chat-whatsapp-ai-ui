import { Suspense } from "react";
import type { Metadata } from "next";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getBusinessById } from "@/lib/business/get-business";
import { loadWhatsappConnection } from "@/lib/whatsapp/connection";
import { ConnectWhatsappPanel } from "@/features/whatsapp-onboarding/components/connect-whatsapp-panel";
import { toWhatsappConnectionView } from "@/features/whatsapp-onboarding/map-connection";
import { PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Conectar WhatsApp | ${PRODUCT_DISPLAY_NAME}`,
  description: "Conecta tu WhatsApp Business con Meta Embedded Signup",
};

function ConnectPanelFallback() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}

export default async function WhatsappOnboardingPage() {
  const profile = await requireBusinessAdmin();
  const [business, connection] = await Promise.all([
    getBusinessById(profile.business_id!),
    loadWhatsappConnection(profile.business_id!).catch(() => null),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-[#7678ed]">
          Alta de cliente
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Conectar WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          {business?.name
            ? `Conecta el número de ${business.name} para activar el canal de WhatsApp.`
            : "Conecta el número de WhatsApp Business de tu negocio."}
        </p>
      </div>
      <Suspense fallback={<ConnectPanelFallback />}>
        <ConnectWhatsappPanel initialConnection={toWhatsappConnectionView(connection)} />
      </Suspense>
    </div>
  );
}
