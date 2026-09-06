import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { settingsSchema } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getUserSettings(user.id));
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const current = await getUserSettings(user.id);
  const gold = parsed.data.goldPricePerGram;
  const silver = parsed.data.silverPricePerGram;
  const pricesChanged =
    gold !== current.goldPricePerGram || silver !== current.silverPricePerGram;
  // Touch metals clock when prices change, or when the client reconfirms
  // (same numbers, explicit touchMetals) so aged prices can be cleared.
  const touchMetals = pricesChanged || parsed.data.touchMetals === true;

  const values: Record<string, unknown> = {
    currency: parsed.data.currency.toUpperCase(),
    nisabStandard: parsed.data.nisabStandard,
    calendarBasis: parsed.data.calendarBasis,
    goldPricePerGram: gold,
    silverPricePerGram: silver,
    hawlStartDate: parsed.data.hawlStartDate || null,
    madhhab: parsed.data.madhhab ?? "general",
    updatedAt: new Date().toISOString(),
  };
  if (touchMetals) {
    values.metalsUpdatedAt = new Date().toISOString();
  }
  if (typeof parsed.data.setupComplete === "boolean") {
    values.setupComplete = parsed.data.setupComplete;
  }
  if (parsed.data.trustedAckAt !== undefined) {
    values.trustedAckAt = parsed.data.trustedAckAt || null;
  }

  await db
    .insert(settings)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: settings.userId, set: values });

  return NextResponse.json({ ok: true });
}
