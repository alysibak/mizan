import { NextResponse } from "next/server";
import { perGramFromPerOunce } from "@/lib/metals";
import { PRICE_TTL_SECONDS, currencyApiTable, getJson } from "@/lib/price-fetch";
import {
  ECB_CURRENCIES,
  parseCurrencyApi,
  parseFrankfurter,
  parseGoldApi,
  plausibleMetals,
  type UsdOunces,
} from "@/lib/price-sources";

// Shared caches may serve this response for the same hour the upstream
// answers are kept (see lib/price-fetch).
const CACHE_HEADER = `public, max-age=600, s-maxage=${PRICE_TTL_SECONDS}, stale-while-revalidate=86400`;

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

const UNAVAILABLE = "A free price source was unavailable. Enter prices by hand.";

/**
 * Optional suggestion only; manual prices remain the source of truth. Public,
 * because the calculator works without an account. It carries no user data.
 */
export async function GET(request: Request) {
  const currency = (new URL(request.url).searchParams.get("currency") ?? "CAD")
    .trim()
    .toUpperCase()
    .slice(0, 3);
  if (!/^[A-Z]{3}$/.test(currency)) {
    return NextResponse.json({ error: "Use a three-letter currency" }, { status: 400 });
  }

  // The fallback is asked at the same time, so a slow or missing primary
  // source costs one timeout, not three in a row. It is cached like the rest.
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

  if (!ounces || !fx) {
    return NextResponse.json(
      { error: UNAVAILABLE },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    {
      currency,
      goldPricePerGram: Number(perGramFromPerOunce(ounces.gold, fx).toFixed(2)),
      silverPricePerGram: Number(perGramFromPerOunce(ounces.silver, fx).toFixed(4)),
      asOf: new Date().toISOString(),
      source: [...sources].join(" + "),
    },
    { headers: { "Cache-Control": CACHE_HEADER } },
  );
}
