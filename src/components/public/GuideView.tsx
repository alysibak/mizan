import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GuidedZakat from "@/components/public/GuidedZakat";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

export function guideMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).guide;
  const url = localePath(locale, "/guide");
  return {
    title: { absolute: m.metaTitle },
    description: m.metaDescription,
    alternates: { canonical: url, languages: languageAlternates("/guide") },
    openGraph: {
      title: m.metaTitle,
      description: m.metaDescription,
      url,
      locale: LOCALE_INFO[locale].og,
    },
  };
}

/** The calculator as a conversation: one question a screen, each explained. */
export default function GuideView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.guide;
  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-2xl px-5 pb-20 pt-6 md:px-10">
        {/* The first question is the page: a title, then straight to it. */}
        <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">{m.title}</h1>
        <div className="mt-5">
          <GuidedZakat
            m={m}
            calc={all.calc}
            speech={{ listen: all.common.listen, stop: all.common.stopListening }}
            share={all.common.share}
            locale={locale}
          />
        </div>
      </main>
      <SiteFooter locale={locale} path="/guide" />
    </div>
  );
}
