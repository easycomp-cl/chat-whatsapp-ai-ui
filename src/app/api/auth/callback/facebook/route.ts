import { NextResponse } from "next/server";
import { FACEBOOK_OAUTH_COOKIE, WHATSAPP_CALLBACK_PATH } from "@/lib/meta/embedded-signup";

const COOKIE_MAX_AGE = 10 * 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = new URL(WHATSAPP_CALLBACK_PATH, url.origin);

  const payload = {
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    error: url.searchParams.get("error"),
    error_reason: url.searchParams.get("error_reason"),
    error_description: url.searchParams.get("error_description"),
  };

  for (const [key, value] of Object.entries(payload)) {
    if (value) destination.searchParams.set(key, value);
  }

  const response = NextResponse.redirect(destination, 302);
  if (payload.code || payload.error) {
    response.cookies.set(FACEBOOK_OAUTH_COOKIE, JSON.stringify(payload), {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return response;
}
