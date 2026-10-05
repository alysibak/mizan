import { NextResponse } from "next/server";
import { signedInUser } from "@/lib/api";
import { ECB_CURRENCIES, crossRate, parseFrankfurter } from "@/lib/price-sources";
import { currencyApiTable, getJson } from "@/lib/price-fetch";

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

  const table = (await currencyApiTable()) as { date?: string } | null;
  const rate = crossRate(table, from, to);
  if (rate) {
    return NextResponse.json({ from, to, rate, asOf: table?.date ?? null, source: "currency-api" });
  }
  return unavailable;
}
