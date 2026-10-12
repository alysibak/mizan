import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import ReadAloud from "@/components/ReadAloud";
import MissedTally from "@/components/public/MissedTally";
import { FaqList } from "@/components/public/LandingView";
import { MoreTools } from "@/components/public/ToolPage";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { faqJsonLd } from "@/lib/faq";

const PATH = "/missed-years";

export function missedMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).missed;
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
    twitter: { title: m.metaTitle, description: m.metaDescription },
  };
}

/**
 * For someone who has never paid zakat, or missed years of it: reassurance
 * first, then a tally of what is owed, a plan to pay it, and plain answers.
 */
export default function MissedView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.missed;
  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-6 md:px-10">
        <header className="max-w-2xl">
          <div className="flex items-center justify-between gap-3">
            <p className="label text-brassDeep">{m.eyebrow}</p>
            <ReadAloud
              text={`${m.title}. ${m.lede}`}
              lang={locale}
              listen={all.common.listen}
              stop={all.common.stopListening}
            />
          </div>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">{m.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-sage">{m.lede}</p>
        </header>

        <div className="mt-10">
          <MissedTally m={m} calc={all.calc} locale={locale} />
        </div>

        <section className="mt-14" aria-labelledby="steps">
          <div className="flex items-start justify-between gap-3">
            <h2 id="steps" className="font-serif text-3xl text-ink">
              {m.stepsTitle}
            </h2>
            <ReadAloud
              text={`${m.stepsTitle}. ${m.steps.join(" ")}`}
              lang={locale}
              listen={all.common.listen}
              stop={all.common.stopListening}
            />
          </div>
          <ol className="mt-5 space-y-4">
            {m.steps.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-sm font-medium text-pine nums"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <p className="pt-1 text-base leading-relaxed text-sage">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={localePath(locale, "/guide")} className="btn-primary px-5 py-3 text-base">
              {m.guideLink}
            </Link>
            <Link href={localePath(locale, "/who-can-receive")} className="btn-ghost px-5 py-3 text-base">
              {m.whoLink}
            </Link>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="faq-title">
          <h2 id="faq-title" className="font-serif text-3xl text-ink">
            {m.faqTitle}
          </h2>
          <FaqList items={m.faq} />
        </section>

        {locale === "en" ? <MoreTools except={PATH} /> : null}
      </main>
      <SiteFooter locale={locale} path={PATH} />
      <JsonLd data={faqJsonLd(m.faq)} />
    </div>
  );
}
