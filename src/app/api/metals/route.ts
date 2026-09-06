import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { perGramFromPerOunce } from "@/lib/metals";

export const dynamic = "force-dynamic";

const OZ = { gold: "XAU", silver: "XAG" } as const;

async function readPrice(symbol: string): Promise<number | null> {
  const res = await fetch(`https://api.gold-api.com/price/${symbol}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { price?: number };
  return typeof data.price === "number" && data.price > 0 ? data.price : null;
}

async function usdTo(currency: string): Promise<number | null> {
  if (currency === "USD") return 1;
  const res = await fetch(
    `https://api.frankfurter.app/latest?from=USD&to=${encodeURIComponent(currency)}`,
    { cache: "no-store", signal: AbortSignal.timeout(5000) },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { rates?: Record<string, number> };
  const rate = data.rates?.[currency];
  return typeof rate === "number" && rate > 0 ? rate : null;
}

/** Optional suggestion only. Manual prices remain the source of truth. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currency = (
    new URL(request.url).searchParams.get("currency") ?? "CAD"
  )
    .trim()
    .toUpperCase()
    .slice(0, 3);
  if (!/^[A-Z]{3}$/.test(currency)) {
    return NextResponse.json({ error: "Use a three-letter currency" }, { status: 400 });
  }

  try {
    const [goldOz, silverOz, fx] = await Promise.all([
      readPrice(OZ.gold),
      readPrice(OZ.silver),
      usdTo(currency),
    ]);
    if (!goldOz || !silverOz || !fx) {
      return NextResponse.json(
        { error: "A free price source was unavailable. Enter prices by hand." },
        { status: 503 },
      );
    }
    return NextResponse.json({
      currency,
      goldPricePerGram: Number(perGramFromPerOunce(goldOz, fx).toFixed(2)),
      silverPricePerGram: Number(perGramFromPerOunce(silverOz, fx).toFixed(4)),
      asOf: new Date().toISOString(),
      source: "gold-api.com + frankfurter.app",
    });
  } catch {
    return NextResponse.json(
      { error: "A free price source was unavailable. Enter prices by hand." },
      { status: 503 },
    );
  }
}
