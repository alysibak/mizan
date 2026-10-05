import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";

// Optional cookieless analytics (see src/lib/analytics.ts): allow its script
// and its event endpoint, and nothing else.
function analyticsOrigin(): string {
  if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim()) return "";
  try {
    const src =
      process.env.NEXT_PUBLIC_PLAUSIBLE_SRC?.trim() || "https://plausible.io/js/script.manual.js";
    return ` ${new URL(src).origin}`;
  } catch {
    return "";
  }
}
const analytics = analyticsOrigin();

// Next inlines small bootstrap scripts and styles, so 'unsafe-inline' stays for
// those; the policy still pins every fetch, frame, form, and plugin to this
// origin. Dev mode additionally needs eval and the HMR websocket.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${analytics}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}${analytics}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Self-contained Node server for Docker / VPS. Omit on Vercel (platform handles it).
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  // Silence incorrect workspace-root inference when other lockfiles exist higher up.
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Ignored by browsers over plain http, so local Docker is unaffected.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        // The service worker must be revalidated on every load so updates ship.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
