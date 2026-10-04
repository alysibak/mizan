import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const CODE = /^[A-Z]{3}$/;

/**
 * Optional exchange-rate suggestion for a foreign holding. The rate the user
 * saves is the source of truth; this only pre-fills it and may be offline.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { cache: "no-store", signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return unavailable;
    const data = (await res.json()) as { rates?: Record<string, number>; date?: string };
    const rate = data.rates?.[to];
    if (typeof rate !== "number" || !(rate > 0)) return unavailable;
    return NextResponse.json({ from, to, rate, asOf: data.date ?? null, source: "frankfurter.app" });
  } catch {
    return unavailable;
  }
}
