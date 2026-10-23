import Link from "next/link";
import AccountLinks from "@/components/AccountLinks";
import LanguageMenu from "@/components/LanguageMenu";
import MyZakatChip from "@/components/MyZakatChip";
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
 * Header for the public pages: the name, the Menu, the language and the
 * account, on one row. Everything else Mizan does is in the Menu, so a
 * phone shows no second row of links. "My zakat" joins the row once this
 * phone has kept something.
 */
export default function SiteHeader({ locale = "en" }: { locale?: Locale }) {
  const all = messagesFor(locale);
  const { nav, language, largerText, menu } = all.common;
  return (
    <>
      <LanguageSuggestion locale={locale} texts={suggestionTexts()} />
      {locale === "en" ? <ZakatDayNotice /> : null}
      {/* The top bar stays in view while reading, so the menu is always one tap away. */}
      <header className="sticky top-0 z-30 border-b border-mist/70 bg-porcelain/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-2 md:px-10 md:py-3">
          <Link
            href={localePath(locale, "/")}
            className="inline-flex min-h-[44px] items-center font-serif text-2xl tracking-tight text-ink"
          >
            Mizan
          </Link>
          <div className="flex min-w-0 items-center gap-2 text-sm sm:gap-4">
            {locale === "en" ? <MyZakatChip /> : null}
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
              largerText={largerText}
              report={{ href: localePath(locale, "/report"), label: all.common.report.nav }}
            />
            <LanguageMenu locale={locale} label={language} />
            <AccountLinks
              signIn={nav.signIn}
              openLedger={nav.openLedger}
              yourLedger={nav.yourLedger}
            />
          </div>
        </div>
      </header>
    </>
  );
}
