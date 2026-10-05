export const SITE_NAME = "Mizan";
export const SITE_TAGLINE = "Islamic wealth, in balance";
export const SITE_DESCRIPTION =
  "A free, private zakat calculator and ledger. Weigh your wealth against nisab, track the hawl on the Hijri calendar, record zakat and sadaqah, and close each year with a clear statement.";

function withScheme(host: string): string {
  return /^https?:\/\//.test(host) ? host : `https://${host}`;
}

/**
 * The public address of this deployment, for links that leave the browser:
 * social cards, the sitemap, calendar-feed URLs. Set APP_URL in production;
 * on Vercel the project's production domain is used when it is not set.
 */
export function siteUrl(): URL {
  const raw =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
      ? withScheme(process.env.VERCEL_PROJECT_PRODUCTION_URL.trim())
      : "") ||
    (process.env.VERCEL_URL?.trim() ? withScheme(process.env.VERCEL_URL.trim()) : "") ||
    "http://localhost:3000";
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}

/**
 * The origin to put in a link for this request: APP_URL when set, else the
 * host the browser asked for. Not `request.url`, which behind the standalone
 * server or a proxy carries the bind address (http://0.0.0.0:3000).
 */
export function publicOrigin(request: Request): string {
  if (process.env.APP_URL?.trim()) return siteUrl().origin;
  const first = (v: string | null) => v?.split(",")[0]?.trim() || null;
  const host = first(request.headers.get("x-forwarded-host")) || request.headers.get("host");
  const own = new URL(request.url);
  if (!host) return own.origin;
  const proto = first(request.headers.get("x-forwarded-proto")) || own.protocol.replace(":", "");
  return `${proto === "https" ? "https" : "http"}://${host}`;
}
