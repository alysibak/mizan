import type { Metadata } from "next";
import { renderSVG } from "uqr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PrintButton from "@/components/public/PrintButton";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { siteUrl } from "@/lib/site";

const PATH = "/poster";

export function posterMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).poster;
  const url = localePath(locale, PATH);
  return {
    title: { absolute: m.metaTitle },
    description: m.metaDescription,
    alternates: { canonical: url, languages: languageAlternates(PATH) },
    openGraph: { title: m.metaTitle, description: m.metaDescription, url, locale: LOCALE_INFO[locale].og },
  };
}

/**
 * A one-page poster for a mosque noticeboard, in one language, with a code
 * that opens the beginner's page in that language. Prints on A4.
 */
export default function PosterView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.poster;
  const target = new URL(localePath(locale, "/guide"), siteUrl());
  // The box around it carries the label; the drawing itself is decoration.
  const qr = renderSVG(target.toString(), {
    border: 0,
    ecc: "M",
    blackColor: "#000000",
    whiteColor: "#ffffff",
  }).replace("<svg", '<svg aria-hidden="true" focusable="false"');
  const shown = `${target.host}${target.pathname === "/" ? "" : target.pathname}`;

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-6 md:px-10 print:max-w-none print:p-0">
        <header className="print:hidden">
          <p className="eyebrow">{m.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">{m.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-sage">{m.lede}</p>
          <div className="mt-6">
            <PrintButton label={m.print} />
          </div>
        </header>

        <article
          aria-label={m.headline}
          className="poster mx-auto mt-10 flex max-w-[42rem] flex-col border border-mist bg-white p-8 text-black shadow-sm sm:p-12 print:mt-0 print:min-h-[260mm] print:max-w-none print:border-0 print:shadow-none"
        >
          <p className="font-serif text-xl tracking-wide">Mizan · الميزان</p>
          <h2 className="mt-6 font-serif text-4xl leading-tight sm:text-5xl print:text-6xl">{m.headline}</h2>
          <ol className="mt-8 space-y-5">
            {m.points.map((point, i) => (
              <li key={point} className="flex gap-4 text-lg leading-snug sm:text-xl print:text-2xl">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black font-serif nums">
                  {i + 1}
                </span>
                <span className="pt-1">{point}</span>
              </li>
            ))}
          </ol>
          <div className="mt-auto flex flex-wrap items-center gap-6 pt-10">
            <div
              className="h-40 w-40 shrink-0 print:h-56 print:w-56 [&>svg]:h-full [&>svg]:w-full"
              role="img"
              aria-label={`${m.scan}: ${target.toString()}`}
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <div>
              <p className="font-serif text-2xl print:text-3xl">{m.scan}</p>
              <p className="mt-2 text-base">{m.orVisit}</p>
              <p className="mt-1 break-all font-mono text-lg" dir="ltr">
                {shown}
              </p>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter locale={locale} path={PATH} />
    </div>
  );
}
