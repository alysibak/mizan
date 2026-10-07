"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LOCALE_INFO,
  isLocale,
  isLocalizedPath,
  localePath,
  splitLocale,
  type Locale,
} from "@/i18n/config";
import { setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import { CHOSEN_LOCALE_KEY } from "./LanguageMenu";

const DISMISSED_KEY = "mizan-locale-suggestion-dismissed";

export type SuggestionTexts = Record<Locale, { readHere: string; notNow: string }>;

/** The first of the browser's languages that Mizan has, if any. */
function browserLocale(): Locale | null {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const primary = tag.toLowerCase().split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return null;
}

/**
 * A line, in the visitor's own language, offering this page in it: the one
 * they picked from the menu before, else their browser's. Someone who cannot
 * read English should not have to find a menu to change it.
 */
export default function LanguageSuggestion({
  locale,
  texts,
}: {
  locale: Locale;
  texts: SuggestionTexts;
}) {
  const hydrated = useHydrated();
  const chosen = useStoredValue(CHOSEN_LOCALE_KEY);
  const dismissed = useStoredValue(DISMISSED_KEY);
  const { path } = splitLocale(usePathname() ?? "/");
  if (!hydrated || !isLocalizedPath(path)) return null;

  const wanted = isLocale(chosen) ? chosen : browserLocale();
  if (!wanted || wanted === locale || dismissed === wanted) return null;
  const { readHere, notNow } = texts[wanted];

  return (
    <div
      lang={wanted}
      dir={LOCALE_INFO[wanted].dir}
      className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-b border-pine/30 bg-pine/5 px-5 py-2.5 text-sm"
    >
      <Link
        href={localePath(wanted, path)}
        hrefLang={wanted}
        className="font-medium text-pine underline-offset-2 hover:underline"
        onClick={() => setStoredValue(CHOSEN_LOCALE_KEY, wanted)}
      >
        {readHere}
      </Link>
      <button
        type="button"
        className="text-sage hover:text-ink"
        onClick={() => setStoredValue(DISMISSED_KEY, wanted)}
      >
        {notNow}
      </button>
    </div>
  );
}
