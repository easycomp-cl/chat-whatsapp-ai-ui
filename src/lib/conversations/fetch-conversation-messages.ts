import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Message } from "@/types/database.types";

export const MESSAGE_SELECT_COLUMNS =
  "id, conversation_id, business_id, customer_id, direction, sender_type, sender_user_id, sender_display_name, sender_phone, receiver_phone, content_text, content_type, content_text_snapshot, customer_edited_at, customer_revoked_at, external_id, whatsapp_delivery_status, whatsapp_delivery_error_code, whatsapp_delivery_error_message, ai_generated, created_at, reply_to_message_id, quoted_text, quoted_sender_type, reactions, media, audio_transcript, interactive";

/** Sin columnas nuevas de entrega/interactivo (vista anterior). */
export const MESSAGE_SELECT_COLUMNS_WITH_AUDIO =
  "id, conversation_id, business_id, customer_id, direction, sender_type, sender_phone, receiver_phone, content_text, content_type, content_text_snapshot, customer_edited_at, customer_revoked_at, external_id, whatsapp_delivery_status, ai_generated, created_at, reply_to_message_id, quoted_text, quoted_sender_type, reactions, media, audio_transcript";

/** Misma query que la completa pero sin `audio_transcript` (vista aún no migrada). */
export const MESSAGE_SELECT_COLUMNS_WITH_MEDIA =
  "id, conversation_id, business_id, customer_id, direction, sender_type, sender_phone, receiver_phone, content_text, content_type, content_text_snapshot, customer_edited_at, customer_revoked_at, external_id, whatsapp_delivery_status, ai_generated, created_at, reply_to_message_id, quoted_text, quoted_sender_type, reactions, media";

export const MESSAGE_SELECT_COLUMNS_LEGACY =
  "id, conversation_id, business_id, customer_id, direction, sender_type, sender_phone, receiver_phone, content_text, content_type, external_id, whatsapp_delivery_status, ai_generated, created_at";

const MISSING_COLUMN_PATTERN =
  /column|reactions|quoted|snapshot|customer_edited|customer_revoked|media|audio_transcript|interactive|whatsapp_delivery_error|sender_user|sender_display/i;

type Supabase = SupabaseClient<Database>;

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

  const columnSets = [
    MESSAGE_SELECT_COLUMNS,
    MESSAGE_SELECT_COLUMNS_WITH_AUDIO,
    MESSAGE_SELECT_COLUMNS_WITH_MEDIA,
    MESSAGE_SELECT_COLUMNS_LEGACY,
  ];

  let result = await runQuery(columnSets[0]);

  for (let index = 1; index < columnSets.length; index += 1) {
    if (!result.error || !MISSING_COLUMN_PATTERN.test(result.error.message)) {
      break;
    }
    result = await runQuery(columnSets[index]);
  }

  if (result.error) {
    return { data: null, error: result.error.message };
  }

  const rows = ((result.data ?? []) as unknown as Message[]).slice().reverse();
  return { data: rows, error: null };
}
