import "server-only";

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
