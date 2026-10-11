import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhoCanReceive from "@/components/public/WhoCanReceive";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

export function whoMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).who;
  const url = localePath(locale, "/who-can-receive");
  return {
    title: { absolute: m.metaTitle },
    description: m.metaDescription,
    alternates: { canonical: url, languages: languageAlternates("/who-can-receive") },
    openGraph: {
      title: m.metaTitle,
      description: m.metaDescription,
      url,
      locale: LOCALE_INFO[locale].og,
    },
  };
}

/** Who your zakat can go to, person by person. */
export default function WhoView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.who;
  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-2xl px-5 pb-20 pt-6 md:px-10">
        <header>
          <p className="label text-brassDeep">{m.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">{m.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-sage">{m.lede}</p>
        </header>
        <div className="mt-8">
          <WhoCanReceive
            m={m}
            lang={locale}
            listen={all.common.listen}
            stop={all.common.stopListening}
          />
        </div>
        <p className="mt-8 border-s-2 border-brass ps-4 text-base leading-relaxed text-ink">{m.eight}</p>
        <p className="mt-4 text-sm text-sage">{m.ask}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={localePath(locale, "/guide")} className="btn-primary px-5 py-3 text-base">
            {all.start.ctaGuide}
          </Link>
          <Link href={localePath(locale, "/start")} className="text-sm text-pine hover:underline">
            {all.landing.newHere}
          </Link>
        </div>
      </main>
      <SiteFooter locale={locale} path="/who-can-receive" />
    </div>
  );
}
