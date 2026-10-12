import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import ReadAloud from "@/components/ReadAloud";
import FitrCalc from "@/components/public/FitrCalc";
import RamadanCountdown from "@/components/public/RamadanCountdown";
import { FaqList } from "@/components/public/LandingView";
import { MoreTools } from "@/components/public/ToolPage";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { faqJsonLd } from "@/lib/faq";
import { siteUrl } from "@/lib/site";

const PATH = "/zakat-al-fitr";

export function fitrMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).fitr;
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

/** Zakat al-Fitr (fitrana) for a household, in one language. */
export default function FitrView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.fitr;
  const last = m.sections.length - 1;
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
          <p className="mt-4 text-base leading-relaxed text-sage">{m.lede}</p>
        </header>

        <RamadanCountdown m={all.ramadan} locale={locale} className="mt-6 max-w-2xl" />

        <div className="mt-10">
          <FitrCalc m={m} currencyLabel={all.calc.currency} locale={locale} />
        </div>

        <div className="mt-16 space-y-10">
          {m.sections.map((s, i) => (
            <section key={s.heading} className="space-y-3">
              <h2 className="font-serif text-2xl text-ink">{s.heading}</h2>
              <p className="text-base leading-relaxed text-sage">{s.body}</p>
              {i === last ? (
                <p>
                  <Link href={localePath(locale, "/guide")} className="text-pine hover:underline">
                    {m.calculatorLink}
                  </Link>
                </p>
              ) : null}
            </section>
          ))}
        </div>

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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: m.appName,
          url: new URL(localePath(locale, PATH), siteUrl()).toString(),
          inLanguage: locale,
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description: m.metaDescription,
        }}
      />
    </div>
  );
}
