import Link from "next/link";
import AccountLinks from "@/components/AccountLinks";
import LanguageMenu from "@/components/LanguageMenu";
import TextSizeToggle from "@/components/TextSizeToggle";
import LanguageSuggestion, { type SuggestionTexts } from "@/components/LanguageSuggestion";
import SiteMenu from "@/components/SiteMenu";
import ZakatDayNotice from "@/components/ZakatDayNotice";
import { siteDirectory } from "@/lib/site-directory";
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
  const all = messagesFor(locale);
  const { nav, language, largerText, menu } = all.common;
  const links = [
    // The visitor's own zakat year, in English only so far.
    ...(locale === "en" ? [{ href: "/my", label: "My zakat" }] : []),
    { href: localePath(locale, "/start"), label: nav.start },
    { href: localePath(locale, "/calculator"), label: nav.calculator },
    { href: localePath(locale, "/nisab"), label: nav.nisab },
  ];
  return (
    <>
      <LanguageSuggestion locale={locale} texts={suggestionTexts()} />
      {locale === "en" ? <ZakatDayNotice /> : null}
      {/* The top bar stays in view while reading, so the menu is always one tap away. */}
      <header className="sticky top-0 z-30 border-b border-mist/70 bg-porcelain/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3 md:px-10 md:py-4">
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
            {/* Everything Mizan does, one tap away on every page. */}
            <SiteMenu
              labels={{ open: menu.open, close: menu.close }}
              groups={siteDirectory(locale)}
              search={{
                action: localePath(locale, "/ask"),
                label: all.ask.searchLabel,
                placeholder: all.ask.placeholder,
                button: all.ask.nav,
              }}
            />
            <TextSizeToggle label={largerText} className="hidden md:inline-flex" />
            <LanguageMenu locale={locale} label={language} />
            <AccountLinks
              signIn={nav.signIn}
              openLedger={nav.openLedger}
              yourLedger={nav.yourLedger}
            />
          </div>
        </div>
      </header>
      {/* Phones: the same links on a row of their own, under the bar. */}
      <div className="relative z-20 flex items-center gap-2 border-b border-mist/70 pe-3 md:hidden print:hidden">
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto px-3 text-sm">
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
        <TextSizeToggle label={largerText} />
      </div>
    </>
  );
}
