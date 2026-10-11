import type { Metadata } from "next";
import { renderSVG } from "uqr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PrintButton from "@/components/public/PrintButton";
import { LOCALE_INFO, languageAlternates, localePath, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { siteUrl } from "@/lib/site";

const PATH = "/worksheet";

export function worksheetMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).worksheet;
  const url = localePath(locale, PATH);
  return {
    title: { absolute: m.metaTitle },
    description: m.metaDescription,
    alternates: { canonical: url, languages: languageAlternates(PATH) },
    openGraph: { title: m.metaTitle, description: m.metaDescription, url, locale: LOCALE_INFO[locale].og },
  };
}

/** A line to write an amount on. */
function Line({ label, strong = false }: { label: string; strong?: boolean }) {
  return (
    <div className={"flex items-end gap-4 py-1.5 " + (strong ? "font-semibold" : "")}>
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      <span
        className={"h-8 w-32 shrink-0 sm:w-44 " + (strong ? "border-2 border-black" : "border-b border-black")}
        aria-hidden
      />
    </div>
  );
}

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid pt-4">
      <h3 className="border-b-2 border-black pb-1 font-serif text-lg">{title}</h3>
      <div className="mt-1">{children}</div>
    </section>
  );
}

/**
 * A zakat worksheet to print and fill in by hand, in one language: for anyone
 * who prefers paper, or a volunteer helping an elder. Fits one A4 page.
 */
export default function WorksheetView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.worksheet;
  const target = new URL(localePath(locale, "/nisab"), siteUrl());
  const qr = renderSVG(target.toString(), {
    border: 0,
    ecc: "M",
    blackColor: "#000000",
    whiteColor: "#ffffff",
  }).replace("<svg", '<svg aria-hidden="true" focusable="false"');
  const shown = `${target.host}${target.pathname}`;

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-6 md:px-10 print:max-w-none print:p-0">
        <header className="print:hidden">
          <p className="label text-brassDeep">{m.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">{m.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-sage">{m.lede}</p>
          <div className="mt-6">
            <PrintButton label={m.print} />
          </div>
        </header>

        <article
          aria-label={m.heading}
          className="worksheet mx-auto mt-10 max-w-[42rem] border border-mist bg-white p-6 text-[15px] text-black shadow-sm sm:p-10 print:mt-0 print:max-w-none print:border-0 print:p-0 print:shadow-none"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="font-serif text-2xl">{m.heading}</h2>
            <p className="font-serif text-sm">Mizan · الميزان</p>
          </div>
          <div className="mt-2 grid gap-x-8 sm:grid-cols-2 print:grid-cols-2">
            <Line label={m.day} />
            <Line label={m.currency} />
          </div>

          <Part title={m.haveTitle}>
            {m.have.map((label) => (
              <Line key={label} label={label} />
            ))}
            <Line label={m.haveTotal} strong />
          </Part>

          <Part title={m.oweTitle}>
            {m.owe.map((label) => (
              <Line key={label} label={label} />
            ))}
            <Line label={m.oweTotal} strong />
          </Part>

          <Part title={m.netTitle}>
            <Line label={m.net} strong />
          </Part>

          <Part title={m.nisabTitle}>
            <Line label={m.nisab} strong />
            <p className="mt-1 text-sm leading-snug">{m.nisabHint}</p>
            <p className="mt-1 text-sm font-semibold leading-snug">{m.nisabRule}</p>
          </Part>

          <Part title={m.zakatTitle}>
            <Line label={m.zakat} strong />
          </Part>

          <div className="mt-5 flex items-start gap-5 border-t border-black pt-4">
            <div className="min-w-0 flex-1 space-y-1 text-sm leading-snug">
              <p>{m.notCounted}</p>
              <p>{m.jewellery}</p>
              <p>{m.tola}</p>
              <p className="pt-1 font-semibold">{m.help}</p>
              <p className="break-all font-mono text-xs" dir="ltr">
                {shown}
              </p>
            </div>
            <div
              className="h-24 w-24 shrink-0 [&>svg]:h-full [&>svg]:w-full"
              role="img"
              aria-label={`${m.help} ${target.toString()}`}
              dangerouslySetInnerHTML={{ __html: qr }}
            />
          </div>
        </article>
      </main>
      <SiteFooter locale={locale} path={PATH} />
    </div>
  );
}
