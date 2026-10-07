// Languages for the public pages. English lives at the plain paths
// (/calculator); every other language under its own prefix (/ar/calculator).
// The signed-in app is English for now.

export const LOCALES = ["en", "ar", "ur", "id", "ms", "tr", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Languages served under a prefix. */
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE) as Exclude<
  Locale,
  "en"
>[];

export interface LocaleInfo {
  /** The language's own name for itself, for the language picker. */
  name: string;
  dir: "ltr" | "rtl";
  /** BCP 47 tag for Intl number and date formatting. Latin digits throughout. */
  intl: string;
  /** Open Graph locale. */
  og: string;
}

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  en: { name: "English", dir: "ltr", intl: "en-CA", og: "en_US" },
  ar: { name: "العربية", dir: "rtl", intl: "ar-u-nu-latn", og: "ar_AR" },
  ur: { name: "اردو", dir: "rtl", intl: "ur-PK-u-nu-latn", og: "ur_PK" },
  id: { name: "Bahasa Indonesia", dir: "ltr", intl: "id-ID", og: "id_ID" },
  ms: { name: "Bahasa Melayu", dir: "ltr", intl: "ms-MY", og: "ms_MY" },
  tr: { name: "Türkçe", dir: "ltr", intl: "tr-TR", og: "tr_TR" },
  fr: { name: "Français", dir: "ltr", intl: "fr-FR", og: "fr_FR" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

/** A public path in a language: ("ar", "/calculator") → "/ar/calculator". */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** The language a public path is in, and the path without its prefix. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (first && first !== DEFAULT_LOCALE && isLocale(first)) {
    return { locale: first, path: `/${rest.join("/")}` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}

/** Whether a path (without its language prefix) has a page in every language. */
export function isLocalizedPath(path: string): boolean {
  return (
    path === "/" ||
    path === "/start" ||
    path === "/calculator" ||
    path === "/nisab" ||
    /^\/nisab\/[a-z]{3}$/.test(path)
  );
}

/** hreflang alternates for a page that exists in every language. */
export function languageAlternates(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[l] = localePath(l, path);
  out["x-default"] = path;
  return out;
}

/** Fill "{name}" placeholders. Messages stay plain strings so client components can take them. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}
