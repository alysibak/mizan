import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ReadAloud from "@/components/ReadAloud";
import AskSearch, { type AnswerGroup } from "@/components/public/AskSearch";
import { appliesItems } from "@/components/public/AppliesView";
import { whoItems } from "@/components/public/WhoCanReceive";
import { ENGLISH_ANSWERS } from "@/content/english-answers";
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

/** Every question the site answers, in one language, by topic, each with its page. */
function answerGroups(locale: Locale): AnswerGroup[] {
  const all = messagesFor(locale);
  const page = (path: string, label: string) => ({ href: localePath(locale, path), label });
  const counts = page("/what-counts", all.applies.nav);
  const who = page("/who-can-receive", all.who.nav);
  const start = page("/guide", all.landing.choose.start);
  const fitr = page("/zakat-al-fitr", all.common.footer.fitr);
  const missed = page("/missed-years", all.missed.nav);
  const calculator = page("/calculator", all.common.footer.calculator);
  const groups: AnswerGroup[] = [
    {
      key: "common",
      title: all.landing.questionsTitle,
      items: all.faq.map((f, i) => ({ key: `faq-${i}`, label: f.q, answer: f.a, page: calculator, icon: "question" })),
    },
    {
      key: "counts",
      title: all.applies.nav,
      items: appliesItems(all.applies).map((item) => ({
        ...item,
        key: `counts-${item.key}`,
        page: { ...counts, href: `${counts.href}#${item.key}` },
      })),
    },
    {
      key: "who",
      title: all.who.nav,
      items: whoItems(all.who).map((item) => ({
        ...item,
        key: `who-${item.key}`,
        page: { ...who, href: `${who.href}#${item.key}` },
      })),
    },
    {
      key: "fitr",
      title: all.common.footer.fitr,
      items: all.fitr.faq.map((f, i) => ({ key: `fitr-${i}`, label: f.q, answer: f.a, page: fitr, icon: "fitr" })),
    },
    {
      key: "missed",
      title: all.missed.nav,
      items: all.missed.faq.map((f, i) => ({ key: `missed-${i}`, label: f.q, answer: f.a, page: missed, icon: "missed" })),
    },
  ];
  // Pages in English only so far are found by the English search.
  if (locale === "en") {
    groups.push({
      key: "more",
      title: "Fasts, interest, family, shop, farm and more",
      items: ENGLISH_ANSWERS.map((a) => ({
        key: `en-${a.key}`,
        label: a.label,
        answer: a.answer,
        page: { href: a.href, label: a.page },
        icon: a.key,
        evidence: a.evidence,
      })),
    });
  }
  groups.push({
    key: "words",
    title: all.start.wordsTitle,
    items: all.start.words.map((w, i) => ({ key: `word-${i}`, label: w.term, answer: w.meaning, page: start, icon: "word" })),
  });
  return groups;
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
            <p className="eyebrow">{m.eyebrow}</p>
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
            groups={answerGroups(locale)}
            m={m}
            locale={locale}
            listen={all.common.listen}
            stop={all.common.stopListening}
            share={{ label: all.common.shareAnswer, labels: all.common.share, path: localePath(locale, PATH) }}
            evidenceSuffix={all.common.inEnglish}
          />
        </div>
      </main>
      <SiteFooter locale={locale} path={PATH} />
    </div>
  );
}
