import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AnswerList, { type AnswerItem, type Tone } from "@/components/public/AnswerList";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import type { Messages } from "@/i18n/messages/en";

const PATH = "/what-counts";

type Applies = Messages["applies"];
type CaseKey = keyof Applies["cases"];
type Verdict = keyof Applies["verdicts"];

/** Each thing, and the answer most scholars give. The words are per language. */
const CASES: { key: CaseKey; verdict: Verdict }[] = [
  { key: "home", verdict: "no" },
  { key: "car", verdict: "no" },
  { key: "salary", verdict: "ifSaved" },
  { key: "goals", verdict: "yes" },
  { key: "bullion", verdict: "yes" },
  { key: "jewellery", verdict: "differ" },
  { key: "gems", verdict: "no" },
  { key: "landToSell", verdict: "yes" },
  { key: "landToLive", verdict: "mostNo" },
  { key: "rental", verdict: "partly" },
  { key: "business", verdict: "yes" },
  { key: "lent", verdict: "yes" },
  { key: "shares", verdict: "yes" },
  { key: "crypto", verdict: "yes" },
  { key: "pension", verdict: "differ" },
  { key: "bonds", verdict: "partly" },
];

const TONE: Record<Verdict, Tone> = {
  yes: "yes",
  no: "no",
  mostNo: "no",
  partly: "mixed",
  ifSaved: "mixed",
  differ: "mixed",
};

/** "Do I pay zakat on…?", thing by thing, in one language. */
export function appliesItems(m: Applies): AnswerItem[] {
  return CASES.map(({ key, verdict }) => ({
    key,
    label: m.cases[key].label,
    verdict: m.verdicts[verdict],
    tone: TONE[verdict],
    answer: m.cases[key].answer,
  }));
}

export function appliesMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).applies;
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
  };
}

/** "Do I pay zakat on…?", thing by thing. */
export default function AppliesView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.applies;
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
          <AnswerList
            items={appliesItems(m)}
            lang={locale}
            listen={all.common.listen}
            stop={all.common.stopListening}
            share={{ label: all.common.shareAnswer, labels: all.common.share, path: localePath(locale, PATH) }}
          />
        </div>
        <p className="mt-6 text-sm text-sage">
          {all.who.ask}{" "}
          <Link href={localePath(locale, "/sources")} className="text-pine hover:underline">
            {all.sources.nav}
          </Link>
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={localePath(locale, "/guide")} className="btn-primary px-5 py-3 text-base">
            {all.start.ctaGuide}
          </Link>
          <Link href={localePath(locale, "/who-can-receive")} className="text-sm text-pine hover:underline">
            {all.who.nav}
          </Link>
        </div>
      </main>
      <SiteFooter locale={locale} path={PATH} />
    </div>
  );
}
