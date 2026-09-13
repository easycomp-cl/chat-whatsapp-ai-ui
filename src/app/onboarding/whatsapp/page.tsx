import type { Metadata } from "next";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getBusinessById } from "@/lib/business/get-business";
import { getWhatsappConnectionAction } from "@/lib/actions/whatsapp-onboarding-actions";
import { ConnectWhatsappPanel } from "@/features/whatsapp-onboarding/components/connect-whatsapp-panel";
import { PRODUCT_DISPLAY_NAME } from "@/lib/brand/constants";
import type { WhatsappConnectionView } from "@/features/whatsapp-onboarding/types";

export const metadata: Metadata = {
  title: `Conectar WhatsApp | ${PRODUCT_DISPLAY_NAME}`,
  description: "Conecta tu WhatsApp Business con Meta Embedded Signup",
};

export default async function WhatsappOnboardingPage() {
  const profile = await requireBusinessAdmin();
  const [business, connection] = await Promise.all([
    getBusinessById(profile.business_id!),
    getWhatsappConnectionAction(),
  ]);

  const initialConnection: WhatsappConnectionView | null = connection
    ? {
        connected: connection.connected,
        persisted: connection.persisted,
        backendPending: connection.backendPending,
        status: connection.backendPending
          ? "authorized_pending_backend"
          : connection.connected
            ? "connected"
            : "idle",
        phoneNumber: connection.phone_number,
        phoneNumberId: connection.phone_number_id,
        wabaId: connection.waba_id,
        metaBusinessId: connection.business_id,
        message: connection.message,
      }
    : null;

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
      <ConnectWhatsappPanel initialConnection={initialConnection} />
    </div>
  );
}
