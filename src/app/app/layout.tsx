import { requireAppAccess } from "@/lib/auth/session";
import { getBusinessById } from "@/lib/business/get-business";
import { loadWhatsappConnection } from "@/lib/whatsapp/connection";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAppAccess();
  const [business, connection] = await Promise.all([
    getBusinessById(profile.business_id!),
    loadWhatsappConnection(profile.business_id!).catch(() => null),
  ]);

  return (
    <AppShell
      businessId={profile.business_id!}
      businessName={business?.name ?? "Mi negocio"}
      botEnabled={business?.bot_global_enabled ?? false}
      userName={profile.full_name ?? "Usuario"}
      userRole={profile.role}
      whatsappConnected={Boolean(connection?.connected)}
    >
      {children}
    </AppShell>
  );
}
