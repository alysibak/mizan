import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter, { toolLinks } from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import { LOCALE_INFO, fmt, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { formatMoney } from "@/lib/money";
import { SITE_NAME, siteUrl } from "@/lib/site";

export function landingMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).landing;
  return {
    title: { absolute: m.metaTitle },
    description: m.metaDescription,
    alternates: { canonical: localePath(locale, "/"), languages: languageAlternates("/") },
    openGraph: {
      title: m.metaTitle,
      description: m.metaDescription,
      url: localePath(locale, "/"),
      locale: LOCALE_INFO[locale].og,
    },
  };
}

/**
 * The home page in one language. Static: signed-in visitors are sent to their
 * balance by the proxy, so it never touches the database.
 */
export default function LandingView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.landing;
  const inEnglish = all.common.inEnglish;
  const intl = LOCALE_INFO[locale].intl;
  const money = (n: number) => formatMoney(n, "USD", intl);
  const calculator = localePath(locale, "/calculator");

  const rows: [string, string, boolean][] = [
    [m.sample.cash, money(18400), false],
    [m.sample.gold, money(4890), false],
    [fmt(m.sample.funds, { amount: money(12000) }), money(3000), false],
    [m.sample.debts, `−${money(1800)}`, true],
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-porcelain bg-pine-wash">
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-80" aria-hidden />
      <SiteHeader locale={locale} />

      <main>
        <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:px-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:pt-16">
          <div>
            <p className="animate-fade-up font-serif text-sm tracking-[0.2em] text-brassDeep">
              {m.eyebrow}
            </p>
            <h1 className="animate-fade-up mt-4 font-serif text-5xl leading-[1.08] tracking-tight text-ink sm:text-6xl md:text-7xl">
              {m.title}
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-sage"
              style={{ animationDelay: "80ms" }}
            >
              {m.lede}
            </p>
            <Link
              href={localePath(locale, "/start")}
              className="animate-fade-up group mt-8 flex max-w-xl items-center justify-between gap-4 border border-brass/60 bg-paper/80 px-5 py-4 transition hover:border-brassDeep"
              style={{ animationDelay: "110ms" }}
            >
              <span>
                <span className="block font-serif text-xl text-ink">{m.newHere}</span>
                <span className="mt-0.5 block text-sm text-sage">{m.newHereHint}</span>
              </span>
              <span
                className="text-2xl text-brassDeep transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                aria-hidden
              >
                →
              </span>
            </Link>
            <div
              className="animate-fade-up mt-6 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "140ms" }}
            >
              <Link href={calculator} className="btn-primary px-6 py-3 text-base">
                {m.ctaCalculate}
              </Link>
              <Link href="/register" className="btn-ghost px-6 py-3 text-base">
                {m.ctaLedger}
              </Link>
            </div>
            <p
              className="animate-fade-up mt-6 text-sm text-sage"
              style={{ animationDelay: "200ms" }}
            >
              {m.trustLine}
            </p>
          </div>

          <figure
            className="animate-fade-up card relative z-10 p-6"
            style={{ animationDelay: "220ms" }}
            aria-label={m.sample.aria}
          >
            <div className="relative mx-auto h-24 max-w-xs" aria-hidden>
              <div
                className="absolute left-1/2 top-5 h-px w-56 bg-ink/70"
                style={{ transform: "translateX(-50%) rotate(-6deg)" }}
              >
                <span className="absolute -left-1.5 -top-1 h-3 w-3 rotate-45 border border-brass bg-paper" />
                <span className="absolute -right-1.5 -top-1 h-3 w-3 rotate-45 border border-brass bg-paper" />
              </div>
              <div className="absolute left-1/2 top-5 h-12 w-px -translate-x-1/2 bg-mist" />
              <div className="absolute bottom-1 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[9px] border-b-[16px] border-x-transparent border-b-ink/80" />
            </div>
            <p className="label mt-2 text-pine">{m.sample.due}</p>
            <p className="mt-1 font-serif text-4xl text-pine nums">{money(612.25)}</p>
            <p className="mt-1 text-xs text-sage">{fmt(m.sample.summary, { net: money(24490) })}</p>
            <dl className="mt-5 space-y-1.5 border-t border-mist pt-4 text-sm">
              {rows.map(([label, value, debt]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-sage">{label}</dt>
                  <dd className={"nums " + (debt ? "text-danger" : "text-ink")}>{value}</dd>
                </div>
              ))}
            </dl>
            <figcaption className="mt-4 text-xs text-sage">{m.sample.caption}</figcaption>
          </figure>
        </section>

        <section
          className="relative z-10 border-t border-mist bg-paper/60 px-5 py-20 md:px-10"
          aria-labelledby="features"
        >
          <div className="mx-auto max-w-6xl">
            <p className="label text-brassDeep">{m.featuresEyebrow}</p>
            <h2 id="features" className="mt-2 max-w-2xl font-serif text-3xl text-ink sm:text-4xl">
              {m.featuresTitle}
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-sage">{m.featuresLede}</p>
            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {m.features.map((f) => (
                <div key={f.title} className="border-t border-mist pt-5">
                  <h3 className="font-serif text-xl text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sage">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 pt-16 md:px-10" aria-labelledby="free-tools">
          <div className="mx-auto max-w-6xl">
            <h2 id="free-tools" className="font-serif text-2xl text-ink">
              {all.common.footer.toolsHeading}
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {toolLinks(locale).map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="btn-ghost">
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="relative z-10 px-5 py-20 md:px-10" aria-labelledby="honest">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
            <div>
              <p className="label text-brassDeep">{m.honestEyebrow}</p>
              <h2 id="honest" className="mt-2 font-serif text-3xl text-ink">
                {m.honestTitle}
              </h2>
              <p className="mt-4 leading-relaxed text-sage">{m.honestBody}</p>
              <p className="mt-4 text-sm">
                <Link href="/method" className="text-pine hover:underline">
                  {all.common.footer.method + inEnglish}
                </Link>
                <span className="mx-2 text-sage">·</span>
                <Link href="/trust" className="text-pine hover:underline">
                  {all.common.footer.trust + inEnglish}
                </Link>
              </p>
            </div>
            <div>
              <p className="label text-brassDeep">{m.privateEyebrow}</p>
              <h2 className="mt-2 font-serif text-3xl text-ink">{m.privateTitle}</h2>
              <ul className="mt-4 space-y-2 leading-relaxed text-sage">
                {m.privateItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm">
                <Link href="/privacy" className="text-pine hover:underline">
                  {m.privacyLink + inEnglish}
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section
          className="relative z-10 border-t border-mist bg-paper/60 px-5 py-20 md:px-10"
          aria-labelledby="questions"
        >
          <div className="mx-auto max-w-3xl">
            <h2 id="questions" className="font-serif text-3xl text-ink">
              {m.questionsTitle}
            </h2>
            <FaqList items={all.faq.slice(0, 5)} />
            <p className="mt-4 text-sm">
              <Link href={`${calculator}#faq`} className="text-pine hover:underline">
                {m.moreQuestions}
              </Link>
            </p>
          </div>
        </section>

        <section className="relative z-10 px-5 py-24 text-center md:px-10">
          <h2 className="mx-auto max-w-2xl font-serif text-4xl text-ink">{m.finalTitle}</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={calculator} className="btn-primary px-6 py-3 text-base">
              {m.ctaCalculate}
            </Link>
            <Link href="/register" className="btn-ghost px-6 py-3 text-base">
              {m.ctaLedger}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} path="/" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: new URL(localePath(locale, "/"), siteUrl()).toString(),
          inLanguage: locale,
          description: m.metaDescription,
        }}
      />
    </div>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mt-6 divide-y divide-mist border-y border-mist">
      {items.map((f) => (
        <details key={f.q} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
            {f.q}
            <span className="text-sage transition group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-sage">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
