import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getProfile } from "@/lib/auth/session";
import { createClient as createUserClient } from "@/lib/supabase/server";

const CHAT_MEDIA_BUCKET = process.env.SUPABASE_CHAT_MEDIA_BUCKET ?? "chat-media";

type MessageMediaRecord = {
  storagePath: string;
  mimeType: string;
  filename: string | null;
  fileSize: number | null;
};

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL no configurado");
  return url.replace(/\/$/, "");
}

function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY no configurado");
  return key;
}

function getAdminSupabase() {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchMessageMediaRecord(messageId: string): Promise<MessageMediaRecord | null> {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();

  const res = await fetch(
    `${url}/rest/v1/MessageMedia?messageId=eq.${encodeURIComponent(messageId)}&select=storagePath,mimeType,filename,fileSize&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) return null;

  const rows = (await res.json()) as Array<{
    storagePath?: string | null;
    mimeType?: string | null;
    filename?: string | null;
    fileSize?: number | null;
  }>;

  const row = rows[0];
  if (!row?.storagePath?.trim()) return null;

  return {
    storagePath: row.storagePath.trim(),
    mimeType: row.mimeType?.trim() || "application/octet-stream",
    filename: row.filename ?? null,
    fileSize: row.fileSize ?? null,
  };
}

async function assertUserCanAccessMessage(messageId: string, businessId: string) {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id")
    .eq("id", messageId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Mensaje no encontrado o sin permiso");
  }
}

export function isBotApiUnavailableStatus(status: number) {
  return status === 404 || status === 502 || status === 503 || status === 504;
}

async function requireApiProfile() {
  const profile = await getProfile();
  if (!profile?.active || !profile.business_id) {
    throw new Error("No autorizado");
  }
  return profile;
}

export async function resolveMessageMediaFromSupabase(
  messageId: string,
  expiresIn = 3600
): Promise<{
  signedUrl: string;
  mimeType: string;
  filename: string | null;
  fileSize: number | null;
} | null> {
  const profile = await requireApiProfile();
  const businessId = profile.business_id!;

  await assertUserCanAccessMessage(messageId, businessId);

  const media = await fetchMessageMediaRecord(messageId);
  if (!media) return null;

  const admin = getAdminSupabase();
  const { data, error } = await admin.storage
    .from(CHAT_MEDIA_BUCKET)
    .createSignedUrl(media.storagePath, expiresIn);

  if (error || !data?.signedUrl) return null;

  return {
    signedUrl: data.signedUrl,
    mimeType: media.mimeType,
    filename: media.filename,
    fileSize: media.fileSize,
  };
}

export async function downloadMessageMediaFromSupabase(messageId: string): Promise<{
  blob: Blob;
  mimeType: string;
  filename: string | null;
} | null> {
  const profile = await requireApiProfile();
  const businessId = profile.business_id!;

  await assertUserCanAccessMessage(messageId, businessId);

  const media = await fetchMessageMediaRecord(messageId);
  if (!media) return null;

  const admin = getAdminSupabase();
  const { data, error } = await admin.storage.from(CHAT_MEDIA_BUCKET).download(media.storagePath);

  if (error || !data) return null;

  return {
    blob: data,
    mimeType: media.mimeType,
    filename: media.filename,
  };
}
