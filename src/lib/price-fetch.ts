import "server-only";
import { perGramFromPerOunce } from "./metals";
import {
  ECB_CURRENCIES,
  parseCurrencyApi,
  parseFrankfurter,
  parseGoldApi,
  plausibleMetals,
  type UsdOunces,
} from "./price-sources";

// Fetching for the free, keyless price sources. Every answer is kept for an
// hour in Next's data cache, so a busy site asks each source a few times an
// hour however many people are using the calculator.

export const PRICE_TTL_SECONDS = 3600;

/**
 * Daily rates for ~200 currencies (PKR, SAR, BDT, NGN, …) plus gold and
 * silver, served from two CDNs. Used where the ECB rates behind frankfurter
 * stop, or when gold-api.com is down.
 */
const CURRENCY_API = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.json",
];

/** GET a JSON document, or null on any failure. Never throws. */
export async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      next: { revalidate: PRICE_TTL_SECONDS },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** The currency-api USD table from whichever mirror answers first. */
export async function currencyApiTable(): Promise<unknown> {
  const answers = CURRENCY_API.map(async (url) => {
    const data = await getJson(url);
    if (!data) throw new Error("no answer");
    return data;
  });
  return Promise.any(answers).catch(() => null);
}

async function goldApiOunces(): Promise<UsdOunces | null> {
  const [gold, silver] = await Promise.all([
    getJson("https://api.gold-api.com/price/XAU").then(parseGoldApi),
    getJson("https://api.gold-api.com/price/XAG").then(parseGoldApi),
  ]);
  const metals = gold && silver ? { gold, silver } : null;
  return metals && plausibleMetals(metals) ? metals : null;
}

async function frankfurterRate(currency: string): Promise<number | null> {
  if (currency === "USD") return 1;
  if (!ECB_CURRENCIES.has(currency)) return null;
  const data = await getJson(
    `https://api.frankfurter.app/latest?from=USD&to=${encodeURIComponent(currency)}`,
  );
  return parseFrankfurter(data, currency);
}

export interface MetalPrices {
  currency: string;
  goldPricePerGram: number;
  silverPricePerGram: number;
  asOf: string;
  source: string;
}

/**
 * Today's gold and silver price per gram in a currency, or null when no free
 * source answers. The fallback source is asked at the same time, so a slow
 * or missing primary costs one timeout, not three in a row.
 */
export async function getMetalPrices(currency: string): Promise<MetalPrices | null> {
  const fallbackTable = currencyApiTable();
  let [ounces, fx] = await Promise.all([goldApiOunces(), frankfurterRate(currency)]);
  const sources = new Set<string>();
  if (ounces) sources.add("gold-api.com");
  if (fx && currency !== "USD") sources.add("frankfurter.app");

  if (!ounces || !fx) {
    const fallback = parseCurrencyApi(await fallbackTable, currency);
    if (!ounces && fallback.metals) {
      ounces = fallback.metals;
      sources.add("currency-api");
    }
    if (!fx && fallback.fx) {
      fx = fallback.fx;
      sources.add("currency-api");
    }
  }
  if (!ounces || !fx) return null;

  return {
    currency,
    goldPricePerGram: Number(perGramFromPerOunce(ounces.gold, fx).toFixed(2)),
    silverPricePerGram: Number(perGramFromPerOunce(ounces.silver, fx).toFixed(4)),
    asOf: new Date().toISOString(),
    source: [...sources].join(" + "),
  };
}
