import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ReportProblem from "@/components/public/ReportProblem";
import { languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

export function reportMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).common.report;
  return {
    title: m.title,
    description: m.lede,
    alternates: { canonical: localePath(locale, "/report"), languages: languageAlternates("/report") },
    robots: { index: false, follow: true },
  };
}

/** "Report a problem", in the reader's language. */
export default function ReportView({ locale }: { locale: Locale }) {
  const m = messagesFor(locale).common.report;
  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-xl space-y-6 px-5 pb-16 pt-6 md:px-10">
        <header>
          <h1 className="font-serif text-4xl leading-tight text-ink">{m.title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-sage">{m.lede}</p>
        </header>
        <ReportProblem m={m} locale={locale} />
      </main>
      <SiteFooter locale={locale} path="/report" />
    </div>
  );
}
