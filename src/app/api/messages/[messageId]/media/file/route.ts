import { NextResponse } from "next/server";
import { botApi, BotApiError } from "@/lib/bot-api/client";
import { getSessionUser } from "@/lib/auth/session";
import {
  downloadMessageMediaFromSupabase,
  isBotApiUnavailableStatus,
} from "@/lib/conversations/message-media-supabase";

type RouteContext = {
  params: Promise<{ messageId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { messageId } = await context.params;

  try {
    const upstream = await botApi.streamMessageMediaFile(messageId);
    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    const contentDisposition = upstream.headers.get("content-disposition");
    if (contentType) headers.set("content-type", contentType);
    if (contentDisposition) headers.set("content-disposition", contentDisposition);
    headers.set("cache-control", "private, max-age=300");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    if (error instanceof BotApiError && isBotApiUnavailableStatus(error.status)) {
      try {
        const fallback = await downloadMessageMediaFromSupabase(messageId);
        if (fallback) {
          const headers = new Headers();
          headers.set("content-type", fallback.mimeType);
          if (fallback.filename) {
            headers.set(
              "content-disposition",
              `inline; filename="${fallback.filename.replace(/"/g, "")}"`
            );
          }
          headers.set("cache-control", "private, max-age=300");
          return new NextResponse(fallback.blob, { status: 200, headers });
        }
      } catch {
        // Sin permiso o sin archivo en storage
      }
    }

    if (error instanceof BotApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Error al cargar archivo" }, { status: 500 });
  }
}
