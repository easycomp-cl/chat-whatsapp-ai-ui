import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Excluye rutas públicas legales, pago, estáticos, favicon, robots y sitemap.
     * Las páginas /politica-de-privacidad, /eliminacion-de-datos y /pay no pasan
     * por validación de sesión. `/` sí pasa por middleware y redirige a
     * login o dashboard según haya sesión.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|politica-de-privacidad|eliminacion-de-datos|pay|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
