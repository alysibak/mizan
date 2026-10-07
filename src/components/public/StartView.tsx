import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import PayCheck from "@/components/public/PayCheck";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { faqJsonLd } from "@/lib/faq";

export function startMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).start;
  const url = localePath(locale, "/start");
  return {
    title: { absolute: m.metaTitle },
    description: m.metaDescription,
    alternates: { canonical: url, languages: languageAlternates("/start") },
    openGraph: {
      title: m.metaTitle,
      description: m.metaDescription,
      url,
      locale: LOCALE_INFO[locale].og,
    },
  };
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-mist pt-8">
      <h2 id={id} className="font-serif text-2xl text-ink sm:text-3xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-sage">{children}</div>
    </section>
  );
}

/**
 * Zakat for someone who knows nothing about it yet: what it is, whether they
 * have to pay, how much, on what, when, and to whom, in short plain sentences.
 */
export default function StartView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.start;
  const calculator = localePath(locale, "/calculator");

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-6 md:px-10">
        <header>
          <p className="label text-brassDeep">{m.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            {m.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-sage">{m.lede}</p>
        </header>

        <div className="mt-12 space-y-12">
          <Section id="what" title={m.whatTitle}>
            <p>{m.whatBody}</p>
          </Section>

          <section aria-labelledby="check">
            <h2 id="check" className="font-serif text-2xl text-ink sm:text-3xl">
              {m.checkTitle}
            </h2>
            <p className="mt-2 text-sage">{m.checkLede}</p>
            <div className="mt-5">
              <PayCheck m={m} locale={locale} />
            </div>
          </section>

          <Section id="how-much" title={m.howMuchTitle}>
            <p>{m.howMuchBody}</p>
            <p className="border-s-2 border-brass ps-4 text-ink nums">{m.howMuchExample}</p>
            <p>
              <Link href={calculator} className="font-medium text-pine hover:underline">
                {m.ctaCalculate}
              </Link>
            </p>
          </Section>

          <section aria-labelledby="counts" className="grid gap-8 border-t border-mist pt-8 sm:grid-cols-2">
            <div>
              <h2 id="counts" className="font-serif text-2xl text-ink">
                {m.countsTitle}
              </h2>
              <ul className="mt-3 space-y-2 text-base text-sage">
                {m.counts.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-pine" aria-hidden>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ink">{m.notCountsTitle}</h2>
              <ul className="mt-3 space-y-2 text-base text-sage">
                {m.notCounts.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-sage" aria-hidden>
                      ✕
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-sage sm:col-span-2">{m.jewelleryNote}</p>
          </section>

          <Section id="when" title={m.whenTitle}>
            <p>{m.whenBody}</p>
          </Section>

          <Section id="who" title={m.whoTitle}>
            <p>{m.whoBody}</p>
          </Section>

          <Section id="words" title={m.wordsTitle}>
            <dl className="divide-y divide-mist border-y border-mist">
              {m.words.map((w) => (
                <div key={w.term} className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-medium text-ink">{w.term}</dt>
                  <dd className="text-sm leading-relaxed">{w.meaning}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="ask" title={m.askTitle}>
            <p>{m.askBody}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={calculator} className="btn-primary px-5 py-3 text-base">
                {m.ctaCalculate}
              </Link>
              <Link href={localePath(locale, "/nisab")} className="btn-ghost px-5 py-3 text-base">
                {all.common.footer.nisab}
              </Link>
              <Link href="/guides" className="text-sm text-pine hover:underline">
                {m.guidesLink + all.common.inEnglish}
              </Link>
            </div>
          </Section>
        </div>
      </main>
      <SiteFooter locale={locale} path="/start" />
      <JsonLd
        data={faqJsonLd([
          { q: m.whatTitle, a: m.whatBody },
          { q: m.howMuchTitle, a: `${m.howMuchBody} ${m.howMuchExample}` },
          { q: m.whenTitle, a: m.whenBody },
          { q: m.whoTitle, a: m.whoBody },
        ])}
      />
    </div>
  );
}
