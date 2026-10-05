import { splitLocale } from "@/i18n/config";
import { ENGLISH_TOOL_PATHS } from "@/lib/public-tools";

// Optional, cookieless page and conversion counts (Plausible or a
// self-hosted Plausible-compatible server). Off unless
// NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set at build time.
//
// Only public pages are counted, by path alone. Nothing from inside an
// account (amounts, dates, query strings) is ever sent.

export const PUBLIC_PATHS = [
  "/",
  "/calculator",
  "/nisab",
  ...ENGLISH_TOOL_PATHS,
  "/method",
  "/trust",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/forgot",
];

/** Public pages, in any language: "/ar/calculator" counts like "/calculator". */
export function isPublicPath(pathname: string): boolean {
  const { path } = splitLocale(pathname);
  return PUBLIC_PATHS.includes(path) || path.startsWith("/nisab/");
}

export function analyticsConfig(): { domain: string; src: string } | null {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  if (!domain) return null;
  const src =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC?.trim() || "https://plausible.io/js/script.manual.js";
  return { domain, src };
}

type Plausible = ((event: string, options?: { u?: string; props?: Record<string, string> }) => void) & {
  q?: unknown[];
};

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

/** Send one event, queueing it until the script has loaded. */
export function send(event: string, options?: { u?: string; props?: Record<string, string> }) {
  if (typeof window === "undefined" || !analyticsConfig()) return;
  window.plausible ??= Object.assign(
    (...args: unknown[]) => {
      (window.plausible!.q ??= []).push(args);
    },
    { q: [] as unknown[] },
  ) as Plausible;
  window.plausible(event, options);
}

/** Count a conversion such as "Signup". A no-op when analytics is off. */
export function track(event: string, props?: Record<string, string>): void {
  send(event, props ? { props } : undefined);
}
