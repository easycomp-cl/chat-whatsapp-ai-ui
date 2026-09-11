import "server-only";

import { botApi } from "@/lib/bot-api/client";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database.types";

type BusinessAgentRow = {
  id: string;
  business_id: string;
  name: string;
  role: string;
  is_primary: boolean;
  active: boolean;
};

type BotBusinessAgent = {
  id: string;
  name: string;
  phoneNumber?: string;
  phone?: string;
  role: string;
  isPrimary?: boolean;
  is_primary?: boolean;
  isActive?: boolean;
  active?: boolean;
};

type BotBusinessDetail = {
  agents?: BotBusinessAgent[];
  whatsapp_accounts?: Array<{
    phone_number?: string;
    phoneNumber?: string;
  }>;
};

function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

function isFlowAdminRole(role: string) {
  const normalized = normalizeRole(role);
  return normalized === "tenant_admin" || normalized === "admin";
}

function isAgentActive(agent: BotBusinessAgent) {
  if (agent.isActive === false || agent.active === false) return false;
  return true;
}

async function linkProfileAgentId(profile: Profile, agentId: string) {
  if (profile.agent_id === agentId) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  await fetch(`${url.replace(/\/$/, "")}/rest/v1/profiles?id=eq.${encodeURIComponent(profile.id)}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      agent_id: agentId,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function listAgentsFromSupabase(businessId: string): Promise<BusinessAgentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_agents")
    .select("id, business_id, name, role, is_primary, active")
    .eq("business_id", businessId)
    .eq("active", true);

  if (error) {
    throw new Error("No se pudo verificar el administrador del negocio.");
  }

  return (data ?? []) as BusinessAgentRow[];
}

async function listAgentsFromBotApi(businessId: string): Promise<BotBusinessAgent[]> {
  try {
    const business = (await botApi.getBusiness(businessId)) as BotBusinessDetail;
    return (business.agents ?? []).filter(isAgentActive);
  } catch {
    return [];
  }
}

function pickTenantAdmin<T extends { id: string; name: string; role: string; is_primary?: boolean; isPrimary?: boolean }>(
  agents: T[],
  profile: Profile
): T | null {
  const tenantAdmins = agents.filter((agent) => isFlowAdminRole(agent.role));
  if (tenantAdmins.length === 0) return null;

  const profileName = profile.full_name?.trim().toLowerCase();
  if (profileName) {
    const byName = tenantAdmins.find(
      (agent) => agent.name.trim().toLowerCase() === profileName
    );
    if (byName) return byName;
  }

  const primary = tenantAdmins.find(
    (agent) => agent.is_primary === true || agent.isPrimary === true
  );
  if (primary) return primary;

  if (tenantAdmins.length === 1) {
    return tenantAdmins[0]!;
  }

  return null;
}

async function ensureTenantAdminForBusinessAdmin(
  profile: Profile,
  agents: BotBusinessAgent[]
): Promise<string> {
  const businessId = profile.business_id!;

  const existing = pickTenantAdmin(agents, profile);
  if (existing) {
    await linkProfileAgentId(profile, existing.id);
    return existing.id;
  }

  const promotable =
    agents.find((agent) => agent.isPrimary || agent.is_primary) ?? agents[0];

  if (promotable) {
    await botApi.patchAgent(promotable.id, {
      role: "tenant_admin",
    });
    await linkProfileAgentId(profile, promotable.id);
    return promotable.id;
  }

  let phone: string | undefined;
  try {
    const business = (await botApi.getBusiness(businessId)) as BotBusinessDetail;
    phone =
      business.whatsapp_accounts?.[0]?.phone_number ??
      business.whatsapp_accounts?.[0]?.phoneNumber;
  } catch {
    phone = undefined;
  }

  if (!phone) {
    const suffix = profile.id.replace(/\D/g, "").slice(-8).padStart(8, "0");
    phone = `5699${suffix}`;
  }

  const created = (await botApi.createAgent(businessId, {
    name: profile.full_name?.trim() || "Administrador",
    phone,
    role: "tenant_admin",
    notify_on_handoff: true,
    is_primary: true,
  })) as { id: string };

  await linkProfileAgentId(profile, created.id);
  return created.id;
}

/**
 * ID de TenantAdmin para operaciones de flujos (`created_by_admin_id`, etc.).
 * Resuelve, provisiona y vincula el perfil si hace falta.
 */
export async function resolveFlowAdminId(profile: Profile): Promise<string> {
  if (profile.agent_id) {
    return profile.agent_id;
  }

  if (!profile.business_id) {
    throw new Error("Tu usuario no está asociado a un negocio.");
  }

  const supabaseAgents = await listAgentsFromSupabase(profile.business_id);
  const supabaseMatch = pickTenantAdmin(supabaseAgents, profile);
  if (supabaseMatch) {
    await linkProfileAgentId(profile, supabaseMatch.id);
    return supabaseMatch.id;
  }

  const botAgents = await listAgentsFromBotApi(profile.business_id);
  const botMatch = pickTenantAdmin(botAgents, profile);
  if (botMatch) {
    await linkProfileAgentId(profile, botMatch.id);
    return botMatch.id;
  }

  if (profile.role === "BUSINESS_ADMIN") {
    return ensureTenantAdminForBusinessAdmin(profile, botAgents.length ? botAgents : supabaseAgents);
  }

  throw new Error(
    "Tu usuario no está vinculado a un administrador del equipo. Ve a Equipo o pide al super admin que asigne tu perfil."
  );
}
