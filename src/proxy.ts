import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

// Lightweight UX guard. The authoritative check is the database session lookup
// in getCurrentUser; this only avoids flashing protected pages to logged-out
// visitors and bounces logged-in users away from the auth screens.
const PROTECTED = [
  "/dashboard",
  "/assets",
  "/zakat",
  "/giving",
  "/screening",
  "/settings",
  "/admin",
  "/mirath",
  "/statement",
  "/year",
  "/tools",
  "/begin",
];

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    // Defense in depth on top of SameSite=Lax cookies: browsers label every
    // request with Sec-Fetch-Site, so refuse writes that did not come from
    // this origin. Clients that omit the header (curl, old browsers) carry no
    // ambient cookie risk and pass through.
    if (UNSAFE_METHODS.has(request.method)) {
      const site = request.headers.get("sec-fetch-site");
      if (site && site !== "same-origin") {
        return NextResponse.json(
          { error: "Cross-site request refused" },
          { status: 403 },
        );
      }
    }
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && PROTECTED.some((p) => under(pathname, p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (hasSession && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icons/|sw.js|manifest.webmanifest).*)",
  ],
};
