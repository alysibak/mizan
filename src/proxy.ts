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

// Request bodies are small JSON; only a backup restore is large. Refusing an
// oversized declared body here saves the route from reading it at all.
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_RESTORE_BYTES = 8 * 1024 * 1024;

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
      const length = Number(request.headers.get("content-length"));
      const max = pathname === "/api/import" ? MAX_RESTORE_BYTES : MAX_BODY_BYTES;
      if (Number.isFinite(length) && length > max) {
        return NextResponse.json({ error: "That request is too large." }, { status: 413 });
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

  // Signed-in visitors skip the marketing page and the auth screens, which
  // lets the landing page be served statically without a database lookup.
  if (hasSession && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
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
