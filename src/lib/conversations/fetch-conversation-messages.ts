import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Message } from "@/types/database.types";

/**
 * Columnas de `public.messages` (migración 20260731170000).
 * No incluir `sender_user_id` / `sender_display_name`: la vista de producción no las tiene
 * y PostgREST responde 400 en cada poll del chat.
 */
export const MESSAGE_SELECT_COLUMNS =
  "id, conversation_id, business_id, customer_id, direction, sender_type, sender_phone, receiver_phone, content_text, content_type, content_text_snapshot, customer_edited_at, customer_revoked_at, external_id, whatsapp_delivery_status, whatsapp_delivery_error_code, whatsapp_delivery_error_message, ai_generated, created_at, reply_to_message_id, quoted_text, quoted_sender_type, reactions, media, audio_transcript, interactive";

/** Sin columnas nuevas de entrega/interactivo (vista anterior). */
export const MESSAGE_SELECT_COLUMNS_WITH_AUDIO =
  "id, conversation_id, business_id, customer_id, direction, sender_type, sender_phone, receiver_phone, content_text, content_type, content_text_snapshot, customer_edited_at, customer_revoked_at, external_id, whatsapp_delivery_status, ai_generated, created_at, reply_to_message_id, quoted_text, quoted_sender_type, reactions, media, audio_transcript";

/** Misma query que la completa pero sin `audio_transcript` (vista aún no migrada). */
export const MESSAGE_SELECT_COLUMNS_WITH_MEDIA =
  "id, conversation_id, business_id, customer_id, direction, sender_type, sender_phone, receiver_phone, content_text, content_type, content_text_snapshot, customer_edited_at, customer_revoked_at, external_id, whatsapp_delivery_status, ai_generated, created_at, reply_to_message_id, quoted_text, quoted_sender_type, reactions, media";

export const MESSAGE_SELECT_COLUMNS_LEGACY =
  "id, conversation_id, business_id, customer_id, direction, sender_type, sender_phone, receiver_phone, content_text, content_type, external_id, whatsapp_delivery_status, ai_generated, created_at";

const COLUMN_SETS = [
  MESSAGE_SELECT_COLUMNS,
  MESSAGE_SELECT_COLUMNS_WITH_AUDIO,
  MESSAGE_SELECT_COLUMNS_WITH_MEDIA,
  MESSAGE_SELECT_COLUMNS_LEGACY,
] as const;

const CACHE_KEY = "messages-select-columns-v3";

const MISSING_COLUMN_PATTERN =
  /column|schema cache|does not exist|reactions|quoted|snapshot|customer_edited|customer_revoked|media|audio_transcript|interactive|whatsapp_delivery_error|sender_user|sender_display/i;

type Supabase = SupabaseClient<Database>;
type QueryError = { message?: string; code?: string } | null;

let resolvedColumns: string | null = null;

function readCachedColumns(): string | null {
  if (resolvedColumns) return resolvedColumns;
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

function rememberColumns(columns: string) {
  resolvedColumns = columns;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, columns);
  } catch {
    /* ignore quota / private mode */
  }
}

function shouldRetryWithFewerColumns(error: QueryError): boolean {
  if (!error) return false;
  const message = error.message?.trim() ?? "";
  const code = String(error.code ?? "");
  if (MISSING_COLUMN_PATTERN.test(message)) return true;
  if (code === "PGRST204" || code === "PGRST103" || code === "42703") return true;
  return message.length === 0;
}

function preferredColumnSets(): string[] {
  const cached = readCachedColumns();
  if (cached && COLUMN_SETS.includes(cached as (typeof COLUMN_SETS)[number])) {
    return [cached, ...COLUMN_SETS.filter((columns) => columns !== cached)];
  }
  return [...COLUMN_SETS];
}

export async function fetchConversationMessages(
  supabase: Supabase,
  conversationId: string,
  options?: { limit?: number; chatClearedAt?: string | null }
): Promise<{ data: Message[] | null; error: string | null }> {
  const limit = options?.limit ?? 100;
  const runQuery = (columns: string) => {
    let query = supabase
      .from("messages")
      .select(columns)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options?.chatClearedAt) {
      query = query.gt("created_at", options.chatClearedAt);
    }

    return query;
  };

  const columnSets = preferredColumnSets();
  let usedColumns = columnSets[0];
  let result = await runQuery(usedColumns);

  for (let index = 1; index < columnSets.length; index += 1) {
    if (!result.error || !shouldRetryWithFewerColumns(result.error)) {
      break;
    }
    usedColumns = columnSets[index];
    result = await runQuery(usedColumns);
  }

  if (result.error) {
    return { data: null, error: result.error.message };
  }

  rememberColumns(usedColumns);

  const rows = ((result.data ?? []) as unknown as Message[]).slice().reverse();
  return { data: rows, error: null };
}
