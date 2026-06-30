import { requireBusinessAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { botApi } from "@/lib/bot-api/client";
import { SettingsForm } from "@/features/settings/components/settings-form";
import type { Business } from "@/types/database.types";
import type { KnowledgeSettings } from "@/lib/bot-api/types";

export default async function SettingsPage() {
  const profile = await requireBusinessAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", profile.business_id!)
    .single();

  if (!data) return <p>No se encontró el negocio</p>;

  let knowledge: KnowledgeSettings | undefined;
  try {
    const businessData = (await botApi.getBusiness(profile.business_id!)) as {
      knowledge?: KnowledgeSettings;
      config?: { knowledge?: KnowledgeSettings };
    };
    knowledge = businessData.knowledge ?? businessData.config?.knowledge;
  } catch {
    knowledge = undefined;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">Ajustes del bot y del negocio</p>
      </div>
      <SettingsForm business={data as Business} knowledge={knowledge} />
    </div>
  );
}
