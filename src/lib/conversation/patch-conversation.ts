import "server-only";

type ConversationPatch = {
  mode?: "BOT" | "HUMAN";
  handoffReason?: string | null;
  assignedAdminId?: string | null;
  botResumeAt?: string | null;
  chatClearedAt?: string | null;
};

/** Actualiza `"Conversation"` en la misma DB que lee el dashboard. */
export async function patchConversationInDatabase(
  conversationId: string,
  data: ConversationPatch
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase no configurado");
  }

  const payload: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (data.mode !== undefined) payload.mode = data.mode;
  if (data.handoffReason !== undefined) payload.handoffReason = data.handoffReason;
  if (data.assignedAdminId !== undefined) payload.assignedAdminId = data.assignedAdminId;
  if (data.botResumeAt !== undefined) payload.botResumeAt = data.botResumeAt;
  if (data.chatClearedAt !== undefined) payload.chatClearedAt = data.chatClearedAt;

  const res = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/Conversation?id=eq.${encodeURIComponent(conversationId)}`,
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
