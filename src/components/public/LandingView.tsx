import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import RamadanCountdown from "@/components/public/RamadanCountdown";
import ResumeCard from "@/components/public/ResumeCard";
import QuickAnswer from "@/components/public/QuickAnswer";
import { BalanceScale } from "@/components/public/Visuals";
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
  const intl = LOCALE_INFO[locale].intl;
  const money = (n: number) => formatMoney(n, "USD", intl);
  // The main button opens the one-question-at-a-time guide: someone new is
  // asked one thing at a time instead of meeting every field at once. The
  // full calculator is a tap away in the header and from the guide.
  const guide = localePath(locale, "/guide");

  const rows: [string, string, boolean][] = [
    [m.sample.cash, money(18400), false],
    [m.sample.gold, money(4890), false],
    [fmt(m.sample.funds, { amount: money(12000) }), money(3000), false],
    [m.sample.debts, `−${money(1800)}`, true],
  ];

  // A worked example, on a wide screen beside the question.
  const sample = (
    <figure
                className="animate-fade-up card relative z-10 p-6"
                style={{ animationDelay: "220ms" }}
                aria-label={m.sample.aria}
              >
                {/* The balance that gives Mizan its name, on the example's figures. */}
                <BalanceScale
                  net={24490}
                  nisab={714}
                  money={money}
                  labels={{ you: all.calc.netWealth, nisab: all.calc.nisabSilver }}
                />
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
  );

  return (
    <div className="relative min-h-screen overflow-x-clip bg-porcelain bg-pine-wash">
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-80" aria-hidden />
      <SiteHeader locale={locale} />

      {/* One question and one button. Everything else is in the Menu. */}
      <main>
        <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:px-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:pt-16">
          <div>
            <p className="animate-fade-up font-serif text-sm tracking-[0.2em] text-brassDeep">
              {m.eyebrow}
            </p>
            <h1 className="animate-fade-up mt-4 font-serif text-5xl leading-[1.08] tracking-tight text-ink sm:text-6xl md:text-7xl">
              {m.title}
            </h1>
            <div className="mt-6 max-w-xl empty:hidden">
              <ResumeCard
                locale={locale}
                labels={{
                  title: all.common.resume.title,
                  continue: all.common.resume.continue,
                  zakatIs: all.guide.result.due,
                  stillToGive: all.calc.stillToGive,
                  allGiven: all.calc.allGiven,
                  missed: m.choose.missed,
                }}
              />
            </div>
            {/* The first thirty seconds: type one number, see the answer. */}
            <div className="animate-fade-up mt-8 max-w-xl" style={{ animationDelay: "80ms" }}>
              <QuickAnswer m={m.quick} locale={locale} guideHref={guide} />
            </div>
            <p className="mt-3 text-sm text-sage">{m.trustLine}</p>
            <nav
              aria-label={m.chooseTitle}
              className="animate-fade-up mt-8 flex flex-wrap gap-x-6 gap-y-3 text-base"
              style={{ animationDelay: "140ms" }}
            >
              {(
                [
                  ["/who-can-receive", m.choose.who],
                  ["/zakat-al-fitr", m.choose.fitr],
                  ["/ask", m.choose.ask],
                ] as const
              ).map(([path, label]) => (
                <Link key={path} href={localePath(locale, path)} className="font-medium text-pine hover:underline">
                  {label}
                </Link>
              ))}
            </nav>
            <RamadanCountdown m={all.ramadan} locale={locale} inEnglish={all.common.inEnglish} className="mt-8 max-w-xl" />
          </div>

          {/* A worked example beside the question, on a wide screen only. */}
          <div className="hidden lg:block">{sample}</div>
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
