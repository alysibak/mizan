import Link from "next/link";
import AccountLinks from "@/components/AccountLinks";
import LanguageMenu from "@/components/LanguageMenu";
import LanguageSuggestion, { type SuggestionTexts } from "@/components/LanguageSuggestion";
import { LOCALES, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

/** "Read this page in …" and "Not now", in each language, for the suggestion line. */
function suggestionTexts(): SuggestionTexts {
  return Object.fromEntries(
    LOCALES.map((l) => {
      const { readHere, notNow } = messagesFor(l).common;
      return [l, { readHere, notNow }];
    }),
  ) as SuggestionTexts;
}

/**
 * Header for the public pages. Beginners get "Start here" first, and the
 * language menu sits beside the account links on every screen size.
 */
export default function SiteHeader({ locale = "en" }: { locale?: Locale }) {
  const { nav, language } = messagesFor(locale).common;
  const links = [
    { href: localePath(locale, "/start"), label: nav.start },
    { href: localePath(locale, "/calculator"), label: nav.calculator },
    { href: localePath(locale, "/nisab"), label: nav.nisab },
  ];
  return (
    <header className="relative z-20 print:hidden">
      <LanguageSuggestion locale={locale} texts={suggestionTexts()} />
      <div className="flex items-center justify-between gap-3 px-5 py-4 md:px-10 md:py-5">
        <Link
          href={localePath(locale, "/")}
          className="font-serif text-2xl tracking-tight text-ink"
        >
          Mizan
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sage hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex min-w-0 items-center gap-3 text-sm sm:gap-5">
          <LanguageMenu locale={locale} label={language} />
          <AccountLinks
            signIn={nav.signIn}
            openLedger={nav.openLedger}
            yourLedger={nav.yourLedger}
          />
        </div>
      </div>
      {/* Phones: the same links on a row of their own, always in view. */}
      <nav className="flex gap-1 overflow-x-auto border-y border-mist/70 px-3 text-sm md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap px-2 py-2.5 text-sage hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
