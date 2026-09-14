import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isRoot = path === "/";
  const isAuthRoute =
    path.startsWith("/login") || path.startsWith("/forgot-password");
  const isAuthCallback =
    path.startsWith("/auth/callback") ||
    path.startsWith("/api/auth/callback/facebook");
  const isAppRoute =
    path.startsWith("/app") ||
    path.startsWith("/admin") ||
    path.startsWith("/onboarding");
  const isProtected = isAppRoute;

  if (isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/app/dashboard" : "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!user && !isAuthCallback && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
