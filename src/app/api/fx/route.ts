import { NextResponse } from "next/server";
import { signedInUser } from "@/lib/api";
import { ECB_CURRENCIES, crossRate, parseFrankfurter } from "@/lib/price-sources";

const CURRENCY_API = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.json",
];

async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

const CODE = /^[A-Z]{3}$/;

/**
 * Optional exchange-rate suggestion for a foreign holding. The rate the user
 * saves is the source of truth; this only pre-fills it and may be offline.
 */
export async function GET(request: Request) {
  const { response } = await signedInUser();
  if (response) return response;

  const params = new URL(request.url).searchParams;
  const from = (params.get("from") ?? "").trim().toUpperCase();
  const to = (params.get("to") ?? "").trim().toUpperCase();
  if (!CODE.test(from) || !CODE.test(to)) {
    return NextResponse.json({ error: "Use three-letter currency codes" }, { status: 400 });
  }
  if (from === to) return NextResponse.json({ from, to, rate: 1 });

  const unavailable = NextResponse.json(
    { error: "No free rate source answered. Enter the rate by hand." },
    { status: 503 },
  );

  if (ECB_CURRENCIES.has(from) && ECB_CURRENCIES.has(to)) {
    const data = (await getJson(`https://api.frankfurter.app/latest?from=${from}&to=${to}`)) as {
      date?: string;
    } | null;
    const rate = parseFrankfurter(data, to);
    if (rate) {
      return NextResponse.json({ from, to, rate, asOf: data?.date ?? null, source: "frankfurter.app" });
    }
  }

  for (const url of CURRENCY_API) {
    const data = (await getJson(url)) as { date?: string } | null;
    const rate = crossRate(data, from, to);
    if (rate) {
      return NextResponse.json({ from, to, rate, asOf: data?.date ?? null, source: "currency-api" });
    }
  }
  return unavailable;
}
