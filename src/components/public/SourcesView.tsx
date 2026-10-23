import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ReadAloud from "@/components/ReadAloud";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

const PATH = "/sources";

export function sourcesMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).sources;
  const url = localePath(locale, PATH);
  return {
    title: { absolute: m.metaTitle },
    description: m.metaDescription,
    alternates: { canonical: url, languages: languageAlternates(PATH) },
    openGraph: {
      title: m.metaTitle,
      description: m.metaDescription,
      url,
      locale: LOCALE_INFO[locale].og,
    },
  };
}

/** Each rule the pages use, beside the verse or hadith it rests on. */
export default function SourcesView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.sources;
  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-2xl px-5 pb-20 pt-6 md:px-10">
        <header>
          <p className="eyebrow">{m.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">{m.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-sage">{m.lede}</p>
        </header>
        <ol className="mt-10 space-y-6">
          {m.items.map((item, i) => (
            <li key={item.rule} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-serif text-xl leading-snug text-ink">
                  <span className="text-brassDeep nums">{i + 1}. </span>
                  {item.rule}
                </p>
                <ReadAloud
                  text={`${item.rule} ${item.source}`}
                  lang={locale}
                  listen={all.common.listen}
                  stop={all.common.stopListening}
                />
              </div>
              <p className="mt-3 border-s-2 border-brass/60 ps-3 text-base leading-relaxed text-sage">
                {item.source}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm leading-relaxed text-sage">{m.note}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={localePath(locale, "/guide")} className="btn-primary px-5 py-3 text-base">
            {all.start.ctaGuide}
          </Link>
        </div>
      </main>
      <SiteFooter locale={locale} path={PATH} />
    </div>
  );
}
