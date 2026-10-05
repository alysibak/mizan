import { NextResponse } from "next/server";
import { perGramFromPerOunce } from "@/lib/metals";
import {
  ECB_CURRENCIES,
  parseCurrencyApi,
  parseFrankfurter,
  parseGoldApi,
  plausibleMetals,
  type UsdOunces,
} from "@/lib/price-sources";

// Spot prices barely move within an hour for nisab purposes. Upstream answers
// are kept that long, and shared caches may serve this response for the same
// hour, so a busy public calculator costs the free sources a few calls an hour.
const UPSTREAM_TTL_SECONDS = 3600;
const CACHE_HEADER = `public, max-age=600, s-maxage=${UPSTREAM_TTL_SECONDS}, stale-while-revalidate=86400`;

// Daily rates for ~200 currencies (PKR, SAR, BDT, NGN, …) and gold and silver,
// served from two CDNs. Used where the ECB rates behind frankfurter stop.
const CURRENCY_API = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.json",
];

async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      next: { revalidate: UPSTREAM_TTL_SECONDS },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function currencyApi(): Promise<unknown> {
  for (const url of CURRENCY_API) {
    const data = await getJson(url);
    if (data) return data;
  }
  return null;
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

  let [ounces, fx] = await Promise.all([goldApiOunces(), frankfurterRate(currency)]);
  const sources = new Set<string>();
  if (ounces) sources.add("gold-api.com");
  if (fx && currency !== "USD") sources.add("frankfurter.app");

  if (!ounces || !fx) {
    const fallback = parseCurrencyApi(await currencyApi(), currency);
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
