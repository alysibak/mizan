import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ReadAloud from "@/components/ReadAloud";
import AskSearch from "@/components/public/AskSearch";
import type { AnswerItem } from "@/components/public/AnswerList";
import { appliesItems } from "@/components/public/AppliesView";
import { whoItems } from "@/components/public/WhoCanReceive";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

const PATH = "/ask";

export function askMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).ask;
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

/** Every question the site answers, in one language, each with its page. */
function allAnswers(locale: Locale): AnswerItem[] {
  const all = messagesFor(locale);
  const page = (path: string, label: string) => ({ href: localePath(locale, path), label });
  const counts = page("/what-counts", all.applies.nav);
  const who = page("/who-can-receive", all.who.nav);
  const start = page("/start", all.common.nav.start);
  const fitr = page("/zakat-al-fitr", all.common.footer.fitr);
  const missed = page("/missed-years", all.missed.nav);
  const calculator = page("/calculator", all.common.footer.calculator);
  return [
    ...appliesItems(all.applies).map((item) => ({
      ...item,
      key: `counts-${item.key}`,
      page: { ...counts, href: `${counts.href}#${item.key}` },
    })),
    ...whoItems(all.who).map((item) => ({
      ...item,
      key: `who-${item.key}`,
      page: { ...who, href: `${who.href}#${item.key}` },
    })),
    ...all.faq.map((f, i) => ({ key: `faq-${i}`, label: f.q, answer: f.a, page: calculator, icon: "question" })),
    ...all.missed.faq.map((f, i) => ({ key: `missed-${i}`, label: f.q, answer: f.a, page: missed, icon: "missed" })),
    ...all.fitr.faq.map((f, i) => ({ key: `fitr-${i}`, label: f.q, answer: f.a, page: fitr, icon: "fitr" })),
    ...all.start.words.map((w, i) => ({
      key: `word-${i}`,
      label: w.term,
      answer: w.meaning,
      page: start,
      icon: "word",
    })),
  ];
}

/** "Ask a question": type a word, see every answer that mentions it. */
export default function AskView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.ask;
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
        <div className="mt-8">
          <AskSearch
            items={allAnswers(locale)}
            m={m}
            locale={locale}
            listen={all.common.listen}
            stop={all.common.stopListening}
            share={{ label: all.common.shareAnswer, labels: all.common.share, path: localePath(locale, PATH) }}
          />
        </div>
      </main>
      <SiteFooter locale={locale} path={PATH} />
    </div>
  );
}
