import { NextResponse } from "next/server";
import { botApi, BotApiError } from "@/lib/bot-api/client";
import { getSessionUser } from "@/lib/auth/session";
import {
  isBotApiUnavailableStatus,
  resolveMessageMediaFromSupabase,
} from "@/lib/conversations/message-media-supabase";

type RouteContext = {
  params: Promise<{ messageId: string }>;
};

async function requireAuthenticated() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request, context: RouteContext) {
  const unauthorized = await requireAuthenticated();
  if (unauthorized) return unauthorized;

  const { messageId } = await context.params;
  const { searchParams } = new URL(request.url);
  const expiresIn = Number(searchParams.get("expires_in") ?? "3600");

  try {
    const data = await botApi.getMessageMediaUrl(messageId, expiresIn);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BotApiError && isBotApiUnavailableStatus(error.status)) {
      try {
        const fallback = await resolveMessageMediaFromSupabase(messageId, expiresIn);
        if (fallback) {
          return NextResponse.json({
            message_id: messageId,
            mime_type: fallback.mimeType,
            filename: fallback.filename,
            file_size: fallback.fileSize,
            media_url: fallback.signedUrl,
            backend_proxy: false,
            expires_in_seconds: expiresIn,
            source: "supabase_storage",
          });
        }
      } catch {
        // Sin permiso o sin archivo en storage
      }
    }

    if (error instanceof BotApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Error al obtener URL de media" }, { status: 500 });
  }
}
