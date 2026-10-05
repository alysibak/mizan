import { NextResponse } from "next/server";
import { PRICE_TTL_SECONDS, getMetalPrices } from "@/lib/price-fetch";

// Shared caches may serve this response for the same hour the upstream
// answers are kept (see lib/price-fetch).
const CACHE_HEADER = `public, max-age=600, s-maxage=${PRICE_TTL_SECONDS}, stale-while-revalidate=86400`;

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

  const prices = await getMetalPrices(currency);
  if (!prices) {
    return NextResponse.json(
      { error: UNAVAILABLE },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(prices, { headers: { "Cache-Control": CACHE_HEADER } });
}
