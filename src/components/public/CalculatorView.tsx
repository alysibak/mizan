import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ZakatCalculator from "@/components/ZakatCalculator";
import JsonLd from "@/components/JsonLd";
import { FaqList } from "@/components/public/LandingView";
import ShareButton from "@/components/public/ShareButton";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { faqJsonLd } from "@/lib/faq";
import { siteUrl } from "@/lib/site";

export function calculatorMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).calculatorPage;
  const url = localePath(locale, "/calculator");
  return {
    title: m.metaTitle,
    description: m.metaDescription,
    alternates: { canonical: url, languages: languageAlternates("/calculator") },
    openGraph: {
      title: m.metaTitle,
      description: m.metaDescription,
      url,
      locale: LOCALE_INFO[locale].og,
    },
    twitter: { title: m.metaTitle, description: m.metaDescription },
  };
}

/** The public calculator page in one language. */
export default function CalculatorView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.calculatorPage;
  const inEnglish = all.common.inEnglish;
  const url = new URL(localePath(locale, "/calculator"), siteUrl()).toString();
  const [before, middle, after] = m.faqFooter.split(/\{method\}|\{trust\}/);

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-10">
        <header className="max-w-2xl">
          <p className="label text-brassDeep">{m.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">{m.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-sage">{m.lede}</p>
          <p className="mt-3 text-sm">
            <Link href={localePath(locale, "/start")} className="font-medium text-pine hover:underline">
              {all.landing.newHere}
            </Link>
          </p>
        </header>

        <div className="mt-10">
          <ZakatCalculator m={all.calc} locale={locale} />
        </div>

        <div className="mt-8">
          <ShareButton
            label={all.calc.share}
            text={all.calc.shareText}
            path={localePath(locale, "/calculator")}
            labels={all.common.share}
          />
        </div>

        <section className="mt-20 grid gap-10 md:grid-cols-3" aria-labelledby="how">
          <h2 id="how" className="sr-only">
            {m.howTitle}
          </h2>
          {m.how.map((step) => (
            <div key={step.title}>
              <p className="font-serif text-xl text-ink">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-sage">{step.body}</p>
            </div>
          ))}
        </section>

        <section id="faq" className="mt-20 max-w-3xl scroll-mt-6" aria-labelledby="faq-title">
          <h2 id="faq-title" className="font-serif text-3xl text-ink">
            {m.faqTitle}
          </h2>
          <FaqList items={all.faq} />
          <p className="mt-6 text-sm text-sage">
            {before}
            <Link href="/method" className="text-pine hover:underline">
              {all.common.footer.method + inEnglish}
            </Link>
            {middle}
            <Link href="/trust" className="text-pine hover:underline">
              {all.common.footer.trust + inEnglish}
            </Link>
            {after}
          </p>
        </section>
      </main>
      <SiteFooter locale={locale} path="/calculator" />
      <JsonLd data={faqJsonLd(all.faq)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: m.appName,
          url,
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
