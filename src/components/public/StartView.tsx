import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import PayCheck from "@/components/public/PayCheck";
import ReadAloud from "@/components/ReadAloud";
import RamadanCountdown from "@/components/public/RamadanCountdown";
import { CountTiles, EightGroups, FortyCoins, LunarYear } from "@/components/public/Visuals";
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
  speak,
  locale,
  children,
}: {
  id: string;
  title: string;
  /** The section's words, read aloud on request. */
  speak?: string;
  locale: Locale;
  children: React.ReactNode;
}) {
  const { listen, stopListening } = messagesFor(locale).common;
  return (
    <section aria-labelledby={id} className="border-t border-mist pt-8">
      <div className="flex items-start justify-between gap-3">
        <h2 id={id} className="font-serif text-2xl text-ink sm:text-3xl">
          {title}
        </h2>
        {speak ? (
          <ReadAloud text={`${title}. ${speak}`} lang={locale} listen={listen} stop={stopListening} />
        ) : null}
      </div>
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
  const guide = localePath(locale, "/guide");

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-6 md:px-10">
        <header>
          <div className="flex items-center justify-between gap-3">
            <p className="label text-brassDeep">{m.eyebrow}</p>
            <ReadAloud
              text={`${m.title}. ${m.lede}`}
              lang={locale}
              listen={all.common.listen}
              stop={all.common.stopListening}
            />
          </div>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            {m.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-sage">{m.lede}</p>
          <RamadanCountdown m={all.ramadan} locale={locale} inEnglish={all.common.inEnglish} className="mt-6" />
        </header>

        <div className="mt-12 space-y-12">
          <Section id="what" title={m.whatTitle} speak={m.whatBody} locale={locale}>
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

          <Section id="how-much" title={m.howMuchTitle} speak={`${m.howMuchBody} ${m.howMuchExample}`} locale={locale}>
            <p>{m.howMuchBody}</p>
            <FortyCoins locale={locale} label={m.howMuchExample} />
            <p>
              <Link href={guide} className="font-medium text-pine hover:underline">
                {m.ctaGuide}
              </Link>
            </p>
          </Section>

          <section aria-labelledby="counts" className="grid gap-8 border-t border-mist pt-8">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 id="counts" className="font-serif text-2xl text-ink">
                  {m.countsTitle}
                </h2>
                <ReadAloud
                  text={`${m.countsTitle}: ${m.counts.join(", ")}. ${m.notCountsTitle}: ${m.notCounts.join(", ")}. ${m.jewelleryNote}`}
                  lang={locale}
                  listen={all.common.listen}
                  stop={all.common.stopListening}
                />
              </div>
              <div className="mt-4">
                <CountTiles items={m.counts} counted />
              </div>
            </div>
            <div>
              <h2 className="font-serif text-2xl text-ink">{m.notCountsTitle}</h2>
              <div className="mt-4">
                <CountTiles items={m.notCounts} counted={false} />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-sage">{m.jewelleryNote}</p>
              <p>
                <Link
                  href={localePath(locale, "/what-counts")}
                  className="text-sm font-medium text-pine hover:underline"
                >
                  {all.applies.nav}
                </Link>
              </p>

            </div>
          </section>

          <Section id="when" title={m.whenTitle} speak={m.whenBody} locale={locale}>
            <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_15rem]">
              <p>{m.whenBody}</p>
              <LunarYear label={m.words[1]?.meaning ?? m.whenBody} />
            </div>
          </Section>

          <Section id="missed" title={m.missedTitle} speak={m.missedBody} locale={locale}>
            <p>{m.missedBody}</p>
            <p>
              <Link
                href={localePath(locale, "/missed-years")}
                className="font-medium text-pine hover:underline"
              >
                {m.missedLink}
              </Link>
            </p>
          </Section>

          <Section id="who" title={m.whoTitle} speak={m.whoBody} locale={locale}>
            <p>{m.whoBody}</p>
            <EightGroups groups={all.who.groups} label={all.who.eight} />
            <p>
              <Link
                href={localePath(locale, "/who-can-receive")}
                className="font-medium text-pine hover:underline"
              >
                {all.who.nav}
              </Link>
            </p>
          </Section>

          <Section id="words" title={m.wordsTitle} speak={m.words.map((w) => `${w.term}: ${w.meaning}`).join(" ")} locale={locale}>
            <dl className="divide-y divide-mist border-y border-mist">
              {m.words.map((w) => (
                <div key={w.term} className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-medium text-ink">{w.term}</dt>
                  <dd className="text-sm leading-relaxed">{w.meaning}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="ask" title={m.askTitle} speak={m.askBody} locale={locale}>
            <p>{m.askBody}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href={guide} className="btn-primary px-5 py-3 text-base">
                {m.ctaGuide}
              </Link>
              <Link href={calculator} className="btn-ghost px-5 py-3 text-base">
                {m.ctaCalculate}
              </Link>
              <Link href={localePath(locale, "/ask")} className="text-sm text-pine hover:underline">
                {all.ask.nav}
              </Link>
              <Link href={localePath(locale, "/worksheet")} className="text-sm text-pine hover:underline">
                {all.worksheet.nav}
              </Link>
              <Link href={localePath(locale, "/nisab")} className="text-sm text-pine hover:underline">
                {all.common.footer.nisab}
              </Link>
              <Link href={localePath(locale, "/sources")} className="text-sm text-pine hover:underline">
                {all.sources.nav}
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
