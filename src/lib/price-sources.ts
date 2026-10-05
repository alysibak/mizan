// Parsing for the free, keyless sources behind the optional price suggestion.
// Kept pure so the shapes and the sanity checks are unit-tested: a source that
// changes its format must fail closed (no suggestion), never suggest a nisab
// that is off by a factor of thirty.

/** Plausible USD per troy ounce. Far wider than any real market move. */
const GOLD_USD_OZ = { min: 300, max: 50_000 };
const SILVER_USD_OZ = { min: 3, max: 2_000 };
/** Gold has traded at 15x to 125x silver in the last century. */
const RATIO = { min: 10, max: 200 };

export interface UsdOunces {
  gold: number;
  silver: number;
}

function positive(n: unknown): number | null {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

/** True when a pair of spot prices looks like real gold and silver. */
export function plausibleMetals(p: UsdOunces): boolean {
  const ratio = p.gold / p.silver;
  return (
    p.gold >= GOLD_USD_OZ.min &&
    p.gold <= GOLD_USD_OZ.max &&
    p.silver >= SILVER_USD_OZ.min &&
    p.silver <= SILVER_USD_OZ.max &&
    ratio >= RATIO.min &&
    ratio <= RATIO.max
  );
}

/** gold-api.com: `{ "price": 2345.6, ... }` in USD per troy ounce. */
export function parseGoldApi(data: unknown): number | null {
  return positive((data as { price?: unknown } | null)?.price);
}

/** frankfurter.app: `{ "rates": { "CAD": 1.37 } }` per one unit of the base. */
export function parseFrankfurter(data: unknown, to: string): number | null {
  return positive((data as { rates?: Record<string, unknown> } | null)?.rates?.[to]);
}

/**
 * fawazahmed0/currency-api, USD base: `{ "date": "…", "usd": { "cad": 1.37,
 * "xau": 0.00043, "xag": 0.034 } }`. Rates are units per one US dollar, so a
 * metal's dollar price per ounce is the reciprocal of its rate.
 */
export function parseCurrencyApi(
  data: unknown,
  currency: string,
): { fx: number | null; metals: UsdOunces | null } {
  const rates = (data as { usd?: Record<string, unknown> } | null)?.usd;
  if (!rates || typeof rates !== "object") return { fx: null, metals: null };
  const code = currency.toLowerCase();
  const fx = code === "usd" ? 1 : positive(rates[code]);
  const xau = positive(rates.xau);
  const xag = positive(rates.xag);
  const metals = xau && xag ? { gold: 1 / xau, silver: 1 / xag } : null;
  return { fx, metals: metals && plausibleMetals(metals) ? metals : null };
}

/** The currencies frankfurter.app (European Central Bank rates) can convert. */
export const ECB_CURRENCIES = new Set([
  "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD",
  "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR", "NOK", "NZD",
  "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR",
]);

/**
 * A cross rate (units of `to` for one `from`) from a currency-api USD table,
 * for pairs the ECB does not quote.
 */
export function crossRate(data: unknown, from: string, to: string): number | null {
  const a = parseCurrencyApi(data, from).fx;
  const b = parseCurrencyApi(data, to).fx;
  return a && b ? b / a : null;
}
