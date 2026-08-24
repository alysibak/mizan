import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

// Lightweight UX guard. The authoritative check is the database session lookup
// in getCurrentUser; this only avoids flashing protected pages to logged-out
// visitors and bounces logged-in users away from the auth screens.
const PROTECTED = ["/dashboard", "/assets", "/zakat", "/giving", "/screening", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
