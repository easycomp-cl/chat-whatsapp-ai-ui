import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Excluye rutas públicas legales, pago, confirmación de número, estáticos,
     * favicon, robots y sitemap.
     * Las páginas /politica-de-privacidad, /eliminacion-de-datos, /pay y
     * /verify-phone no pasan por validación de sesión.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|politica-de-privacidad|eliminacion-de-datos|pay|verify-phone|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
