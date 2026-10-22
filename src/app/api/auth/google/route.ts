import { NextResponse } from "next/server";
import { GOOGLE_COOKIE, GOOGLE_COOKIE_MINUTES, authorizeUrl, googleConfig, newGoogleStart } from "@/lib/google";
import { LIMITS, overLimit } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/redirect";

/**
 * "Continue with Google": off to Google's account picker, remembering in a
 * short-lived cookie how to recognise the answer when it comes back.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const config = googleConfig();
  if (!config) return NextResponse.redirect(new URL("/login", url));
  if (await overLimit(request, LIMITS.google)) {
    return NextResponse.redirect(new URL("/login?google=busy", url));
  }

  const start = newGoogleStart(safeNextPath(url.searchParams.get("next"), ""));
  const res = NextResponse.redirect(authorizeUrl(start, config.clientId));
  res.cookies.set(GOOGLE_COOKIE, JSON.stringify(start), {
    httpOnly: true,
    // Lax: the cookie must come back on Google's top-level redirect.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google",
    maxAge: GOOGLE_COOKIE_MINUTES * 60,
  });
  return res;
}
