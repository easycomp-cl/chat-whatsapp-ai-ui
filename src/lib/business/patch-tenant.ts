import "server-only";

type TenantUpdate = {
  botGlobalEnabled?: boolean;
  confidenceThreshold?: number;
  defaultAiModel?: string;
};

/** Actualiza `"Tenant"` en la misma DB que lee el dashboard. */
export async function patchTenantInDatabase(
  businessId: string,
  data: TenantUpdate
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase no configurado");
  }

  const payload: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (data.botGlobalEnabled !== undefined) {
    payload.botGlobalEnabled = data.botGlobalEnabled;
  }
  if (data.confidenceThreshold !== undefined) {
    payload.confidenceThreshold = data.confidenceThreshold;
  }
  if (data.defaultAiModel !== undefined) {
    payload.defaultAiModel = data.defaultAiModel;
  }

  const res = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/Tenant?id=eq.${encodeURIComponent(businessId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }
}
