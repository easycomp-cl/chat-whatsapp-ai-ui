import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ActivateProfileForm } from "@/features/admin/components/activate-profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Business, Profile } from "@/types/database.types";

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (!business) notFound();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: agents } = await supabase
    .from("business_agents")
    .select("*")
    .eq("business_id", id);

  const biz = business as Business;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{biz.name}</h2>
        <p className="text-muted-foreground">{biz.slug}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Detalle del negocio</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><strong>Estado:</strong> {biz.status}</p>
          <p><strong>Bot:</strong> {biz.bot_global_enabled ? "Activo" : "Pausado"}</p>
          <p><strong>Modelo:</strong> {biz.default_ai_model}</p>
          <p><strong>Zona horaria:</strong> {biz.timezone}</p>
        </CardContent>
      </Card>

      <ActivateProfileForm
        businessId={id}
        profiles={(profiles ?? []) as Profile[]}
        agents={(agents ?? []) as Array<{ id: string; name: string }>}
      />
    </div>
  );
}
