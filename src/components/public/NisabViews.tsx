import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { FaqList } from "@/components/public/LandingView";
import {
  LOCALE_INFO,
  fmt,
  languageAlternates,
  localePath,
  type Locale,
} from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";
import { CALC_CURRENCIES } from "@/lib/calculator";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "@/lib/nisab";
import { formatMoney } from "@/lib/money";
import { getMetalPrices, type MetalPrices } from "@/lib/price-fetch";

/** Currencies shown first on the index, the page language's own on top. */
const POPULAR = [
  "USD",
  "GBP",
  "EUR",
  "CAD",
  "AUD",
  "SAR",
  "AED",
  "QAR",
  "KWD",
  "PKR",
  "INR",
  "BDT",
  "MYR",
  "IDR",
  "TRY",
  "EGP",
  "NGN",
  "ZAR",
];
const HOME_CURRENCY: Partial<Record<Locale, string>> = {
  ar: "SAR",
  ur: "PKR",
  id: "IDR",
  ms: "MYR",
  tr: "TRY",
  fr: "EUR",
};

export function currencyParams(): { currency: string }[] {
  return CALC_CURRENCIES.map((c) => ({ currency: c.toLowerCase() }));
}

/** Only the lowercase codes the pages are published under; /nisab/USD is a 404. */
export function isNisabCurrency(code: string): boolean {
  return (
    code === code.toLowerCase() &&
    (CALC_CURRENCIES as readonly string[]).includes(code.toUpperCase())
  );
}

function currencyName(code: string, locale: Locale): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

function nisabOf(prices: MetalPrices) {
  return {
    silver: NISAB_SILVER_GRAMS * prices.silverPricePerGram,
    gold: NISAB_GOLD_GRAMS * prices.goldPricePerGram,
  };
}

export function nisabIndexMetadata(locale: Locale): Metadata {
  const m = messagesFor(locale).nisabPage;
  const url = localePath(locale, "/nisab");
  return {
    title: { absolute: m.indexMetaTitle },
    description: m.indexMetaDescription,
    alternates: { canonical: url, languages: languageAlternates("/nisab") },
    openGraph: {
      title: m.indexMetaTitle,
      description: m.indexMetaDescription,
      url,
    },
  };
}

export async function nisabCurrencyMetadata(
  locale: Locale,
  code: string,
): Promise<Metadata> {
  const m = messagesFor(locale).nisabPage;
  const path = `/nisab/${code.toLowerCase()}`;
  const url = localePath(locale, path);
  const prices = await getMetalPrices(code);
  const intl = LOCALE_INFO[locale].intl;
  const values = prices ? nisabOf(prices) : null;
  const title = fmt(m.currencyMetaTitle, {
    currency: currencyName(code, locale),
    code,
  });
  const description = values
    ? fmt(m.currencyMetaDescription, {
        currency: currencyName(code, locale),
        silver: formatMoney(values.silver, code, intl),
        gold: formatMoney(values.gold, code, intl),
      })
    : m.indexMetaDescription;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: { title, description, url },
  };
}

function AsOf({ prices, locale }: { prices: MetalPrices; locale: Locale }) {
  const m = messagesFor(locale).nisabPage;
  return (
    <p className="text-xs leading-relaxed text-sage">
      {fmt(m.asOf, {
        source: prices.source,
        when:
          new Date(prices.asOf).toLocaleString(LOCALE_INFO[locale].intl, {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          }) + " UTC",
      })}
    </p>
  );
}

/** Today's nisab in the most-used currencies, with links to every currency. */
export async function NisabIndexView({ locale }: { locale: Locale }) {
  const all = messagesFor(locale);
  const m = all.nisabPage;
  const intl = LOCALE_INFO[locale].intl;
  const home = HOME_CURRENCY[locale];
  const order = home ? [home, ...POPULAR.filter((c) => c !== home)] : POPULAR;
  const rows = await Promise.all(
    order.map(async (c) => [c, await getMetalPrices(c)] as const),
  );
  const anyPrices = rows.find(([, p]) => p)?.[1] ?? null;

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-4xl px-5 pb-16 pt-6 md:px-10">
        <header className="max-w-2xl">
          <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
            {m.indexTitle}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-sage">
            {m.indexLede}
          </p>
        </header>

        <div
          className="card mt-10 overflow-x-auto p-0"
          tabIndex={0}
          role="region"
          aria-label={m.indexTitle}
        >
          <table className="w-full min-w-[30rem] text-start text-sm">
            <thead className="border-b border-mist bg-mist/30 text-xs text-sage">
              <tr>
                <th className="px-4 py-3 text-start font-medium">
                  {m.tableCurrency}
                </th>
                <th className="px-4 py-3 text-end font-medium">
                  {m.tableSilver}
                </th>
                <th className="px-4 py-3 text-end font-medium">
                  {m.tableGold}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([code, prices]) => {
                const values = prices ? nisabOf(prices) : null;
                return (
                  <tr
                    key={code}
                    className="border-b border-mist/70 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={localePath(
                          locale,
                          `/nisab/${code.toLowerCase()}`,
                        )}
                        className="text-pine hover:underline"
                      >
                        {currencyName(code, locale)}
                      </Link>{" "}
                      <span className="text-xs text-sage">{code}</span>
                    </td>
                    <td className="px-4 py-3 text-end text-ink nums">
                      {values ? formatMoney(values.silver, code, intl) : "—"}
                    </td>
                    <td className="px-4 py-3 text-end text-ink nums">
                      {values ? formatMoney(values.gold, code, intl) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          {anyPrices ? (
            <AsOf prices={anyPrices} locale={locale} />
          ) : (
            <p className="text-sm text-warn">{m.unavailable}</p>
          )}
        </div>

        <p className="mt-8 max-w-2xl leading-relaxed text-sage">
          {m.explainer}
        </p>
        <Link
          href={localePath(locale, "/calculator")}
          className="btn-primary mt-6"
        >
          {all.landing.ctaCalculate}
        </Link>

        <section className="mt-16" aria-labelledby="all-currencies">
          <h2 id="all-currencies" className="font-serif text-2xl text-ink">
            {m.allCurrencies}
          </h2>
          <CurrencyLinks locale={locale} />
        </section>
      </main>
      <SiteFooter locale={locale} path="/nisab" />
    </div>
  );
}

function CurrencyLinks({
  locale,
  except,
}: {
  locale: Locale;
  except?: string;
}) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 md:grid-cols-4">
      {CALC_CURRENCIES.filter((c) => c !== except).map((c) => (
        <li key={c}>
          <Link
            href={localePath(locale, `/nisab/${c.toLowerCase()}`)}
            className="text-sage hover:text-ink"
          >
            {currencyName(c, locale)} <span className="text-xs">({c})</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Today's nisab in one currency. */
export async function NisabCurrencyView({
  locale,
  code,
}: {
  locale: Locale;
  code: string;
}) {
  const all = messagesFor(locale);
  const m = all.nisabPage;
  const intl = LOCALE_INFO[locale].intl;
  const prices = await getMetalPrices(code);
  const values = prices ? nisabOf(prices) : null;
  const name = currencyName(code, locale);
  const money = (n: number) => formatMoney(n, code, intl);

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-4xl px-5 pb-16 pt-6 md:px-10">
        <header className="max-w-2xl">
          <p className="label text-brassDeep">
            <Link
              href={localePath(locale, "/nisab")}
              className="hover:text-ink"
            >
              {all.common.footer.nisab}
            </Link>
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            {fmt(m.currencyTitle, { currency: name })}
          </h1>
        </header>

        {values && prices ? (
          <>
            <dl className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="card p-6">
                <dt className="label text-brassDeep">{m.silverLabel}</dt>
                <dd className="mt-2 font-serif text-4xl text-ink nums">
                  {money(values.silver)}
                </dd>
                <dd className="mt-2 text-sm text-sage">
                  {all.calc.silverPerGram}:{" "}
                  <span className="nums">
                    {money(prices.silverPricePerGram)}
                  </span>
                </dd>
              </div>
              <div className="card p-6">
                <dt className="label text-brassDeep">{m.goldLabel}</dt>
                <dd className="mt-2 font-serif text-4xl text-ink nums">
                  {money(values.gold)}
                </dd>
                <dd className="mt-2 text-sm text-sage">
                  {all.calc.goldPerGram}:{" "}
                  <span className="nums">{money(prices.goldPricePerGram)}</span>
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <AsOf prices={prices} locale={locale} />
            </div>
          </>
        ) : (
          <p className="mt-10 border border-warn/40 bg-warn/5 px-4 py-3 text-sm text-ink">
            {m.unavailable}
          </p>
        )}

        <p className="mt-8 max-w-2xl leading-relaxed text-sage">
          {m.explainer}
        </p>
        <Link
          href={`${localePath(locale, "/calculator")}?currency=${code}`}
          className="btn-primary mt-6"
        >
          {fmt(m.cta, { code })}
        </Link>

        <section className="mt-16 max-w-3xl" aria-labelledby="nisab-faq">
          <h2 id="nisab-faq" className="font-serif text-2xl text-ink">
            {all.landing.questionsTitle}
          </h2>
          <FaqList items={all.faq.slice(0, 3)} />
        </section>

        <section className="mt-16" aria-labelledby="other-currencies">
          <h2 id="other-currencies" className="font-serif text-2xl text-ink">
            {m.otherCurrencies}
          </h2>
          <CurrencyLinks locale={locale} except={code} />
        </section>
      </main>
      <SiteFooter locale={locale} path={`/nisab/${code.toLowerCase()}`} />
    </div>
  );
}
