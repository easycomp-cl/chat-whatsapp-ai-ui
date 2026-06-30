import { redirect } from "next/navigation";
import { requireAppAccess, getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import type { Business } from "@/types/database.types";

async function getBusinessData(businessId: string): Promise<Business | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();
  return data as Business | null;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAppAccess();
  const business = await getBusinessData(profile.business_id!);

  return (
    <AppShell
      businessId={profile.business_id!}
      businessName={business?.name ?? "Mi negocio"}
      botEnabled={business?.bot_global_enabled ?? false}
      userName={profile.full_name ?? "Usuario"}
      userRole={profile.role}
    >
      {children}
    </AppShell>
  );
}
