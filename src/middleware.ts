import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Excluye rutas públicas legales, estáticos, favicon, robots y sitemap.
     * Las páginas /politica-de-privacidad y /eliminacion-de-datos no pasan
     * por validación de sesión.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|politica-de-privacidad|eliminacion-de-datos|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
