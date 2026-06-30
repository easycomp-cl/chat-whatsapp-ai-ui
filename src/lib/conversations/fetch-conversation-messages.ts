import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Message } from "@/types/database.types";

export const MESSAGE_SELECT_COLUMNS =
  "id, conversation_id, business_id, customer_id, direction, sender_type, sender_phone, receiver_phone, content_text, content_type, external_id, ai_generated, created_at, reply_to_message_id, quoted_text, quoted_sender_type, reactions";

export const MESSAGE_SELECT_COLUMNS_LEGACY =
  "id, conversation_id, business_id, customer_id, direction, sender_type, sender_phone, receiver_phone, content_text, content_type, external_id, ai_generated, created_at";

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

  let result = await runQuery(MESSAGE_SELECT_COLUMNS);

  if (result.error && /column|reactions|quoted/i.test(result.error.message)) {
    result = await runQuery(MESSAGE_SELECT_COLUMNS_LEGACY);
  }

  if (result.error) {
    return { data: null, error: result.error.message };
  }

  const rows = ((result.data ?? []) as unknown as Message[]).slice().reverse();
  return { data: rows, error: null };
}
