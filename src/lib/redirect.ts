const PROBE_ORIGIN = "http://mizan.invalid";

/**
 * Where to send someone after signing in. Only same-origin paths are allowed,
 * so a crafted `?next=https://elsewhere` (or `//elsewhere`) cannot bounce a
 * freshly signed-in user to another site.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  try {
    const url = new URL(raw, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
