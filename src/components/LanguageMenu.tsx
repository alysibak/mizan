"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LOCALES,
  LOCALE_INFO,
  isLocalizedPath,
  localePath,
  splitLocale,
  type Locale,
} from "@/i18n/config";
import { setStoredValue } from "@/lib/client-store";
import { IconGlobe } from "./icons";

/** The language a visitor picked from the menu; it outranks the browser's. */
export const CHOSEN_LOCALE_KEY = "mizan-locale";

/**
 * The header's language menu: the current language by its own name, opening
 * to every other, each leading to the same page where it exists in that
 * language and to that language's home page where it does not.
 */
export default function LanguageMenu({ locale, label }: { locale: Locale; label: string }) {
  const { path } = splitLocale(usePathname() ?? "/");
  const target = isLocalizedPath(path) ? path : "/";
  const ref = useRef<HTMLDetailsElement>(null);

  // Close on a click elsewhere or Escape, as a menu does.
  useEffect(() => {
    function close(e: Event) {
      const menu = ref.current;
      if (!menu?.open) return;
      if (e instanceof KeyboardEvent) {
        if (e.key !== "Escape") return;
        menu.open = false;
        menu.querySelector("summary")?.focus();
        return;
      }
      if (!menu.contains(e.target as Node)) menu.open = false;
    }
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details ref={ref} className="relative">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 text-sage hover:text-ink [&::-webkit-details-marker]:hidden">
        <IconGlobe className="h-5 w-5" />
        <span className="sr-only">{label}: </span>
        <span lang={locale} className="max-w-[7rem] truncate sm:max-w-none">
          {LOCALE_INFO[locale].name}
        </span>
      </summary>
      <ul className="absolute end-0 top-full z-50 mt-1 min-w-[12rem] border border-mist bg-paper py-1 shadow-lg">
        {LOCALES.map((l) => (
          <li key={l}>
            <Link
              href={localePath(l, target)}
              hrefLang={l}
              lang={l}
              aria-current={l === locale ? "true" : undefined}
              onClick={() => {
                setStoredValue(CHOSEN_LOCALE_KEY, l);
                if (ref.current) ref.current.open = false;
              }}
              className={
                "block px-4 py-3 text-start text-base " +
                (l === locale ? "bg-pine/5 font-medium text-pine" : "text-ink hover:bg-mist/40")
              }
            >
              {LOCALE_INFO[l].name}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
