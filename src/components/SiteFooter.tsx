import Link from "next/link";
import { LOCALES, LOCALE_INFO, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

/** The free tools, labelled in `locale` (most of them are in English only). */
export function toolLinks(locale: Locale): { href: string; label: string }[] {
  const { footer, inEnglish } = messagesFor(locale).common;
  return [
    { href: localePath(locale, "/calculator"), label: footer.calculator },
    { href: localePath(locale, "/nisab"), label: footer.nisab },
    { href: "/inheritance", label: footer.inheritance + inEnglish },
    { href: "/zakat-al-fitr", label: footer.fitr + inEnglish },
    { href: "/halal-stocks", label: footer.stocks + inEnglish },
    { href: "/qurbani", label: footer.qurbani + inEnglish },
  ];
}

/**
 * Footer for the public pages. `path` is the page's own path when it exists
 * in every language, so the language links lead to the same page; otherwise
 * they lead to each language's home page.
 */
export default function SiteFooter({
  locale = "en",
  path = "/",
}: {
  locale?: Locale;
  path?: string;
}) {
  const { footer, inEnglish } = messagesFor(locale).common;
  const tools = toolLinks(locale);
  const about = [
    { href: "/guides", label: footer.guides + inEnglish },
    { href: "/method", label: footer.method + inEnglish },
    { href: "/trust", label: footer.trust + inEnglish },
    { href: "/privacy", label: footer.privacy + inEnglish },
    { href: "/terms", label: footer.terms + inEnglish },
  ];
  return (
    <footer className="relative z-10 border-t border-mist px-5 py-10 text-sm md:px-10 print:hidden">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="max-w-sm sm:col-span-2 md:col-span-1">
          <p className="font-serif text-xl text-ink">Mizan</p>
          <p className="mt-2 text-xs leading-relaxed text-sage">
            {footer.disclaimer}
          </p>
        </div>
        <LinkColumn title={footer.toolsHeading} links={tools} />
        <LinkColumn title={footer.aboutHeading} links={about} />
        <nav aria-label={footer.languages}>
          <p className="label mb-2">{footer.languages}</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-1">
            {LOCALES.map((l) => (
              <li key={l}>
                <Link
                  href={localePath(l, path)}
                  hrefLang={l}
                  lang={l}
                  aria-current={l === locale ? "true" : undefined}
                  className={
                    l === locale
                      ? "font-medium text-ink"
                      : "text-sage hover:text-ink"
                  }
                >
                  {LOCALE_INFO[l].name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <p className="label mb-2">{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sage hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
