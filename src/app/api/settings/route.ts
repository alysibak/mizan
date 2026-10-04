import { NextResponse } from "next/server";
import { and, eq, isNotNull, or } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db";
import { assets, settings } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { firstIssue, settingsSchema } from "@/lib/validation";
import { normalizeAsset } from "@/lib/asset-write";

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
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const current = await getUserSettings(user.id);
  const gold = parsed.data.goldPricePerGram;
  const silver = parsed.data.silverPricePerGram;
  const pricesChanged =
    gold !== current.goldPricePerGram || silver !== current.silverPricePerGram;
  // Touch metals clock when prices change, or when the client reconfirms
  // (same numbers, explicit touchMetals) so aged prices can be cleared.
  const touchMetals = pricesChanged || parsed.data.touchMetals === true;
  const now = new Date().toISOString();

  const values: Partial<typeof settings.$inferInsert> = {
    currency: parsed.data.currency,
    nisabStandard: parsed.data.nisabStandard,
    calendarBasis: parsed.data.calendarBasis,
    goldPricePerGram: gold,
    silverPricePerGram: silver,
    hawlStartDate: parsed.data.hawlStartDate,
    madhhab: parsed.data.madhhab,
    updatedAt: now,
  };
  if (touchMetals) values.metalsUpdatedAt = now;
  if (typeof parsed.data.setupComplete === "boolean") {
    values.setupComplete = parsed.data.setupComplete;
  }
  if (parsed.data.trustedAckAt !== undefined) {
    values.trustedAckAt = parsed.data.trustedAckAt;
  }
  if (parsed.data.hijriCalendar) values.hijriCalendar = parsed.data.hijriCalendar;
  if (parsed.data.timezone) values.timezone = parsed.data.timezone;

  const statements: BatchItem<"sqlite">[] = [
    db
      .insert(settings)
      .values({ userId: user.id, ...values })
      .onConflictDoUpdate({ target: settings.userId, set: values }),
  ];

  // Holdings entered by weight follow the metal price, and a foreign holding
  // whose currency becomes the base is a plain amount again, in the same write.
  const currencyChanged = parsed.data.currency !== current.currency;
  if (pricesChanged || currencyChanged) {
    const special = await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.userId, user.id),
          or(isNotNull(assets.grams), isNotNull(assets.foreignCurrency)),
        ),
      );
    const prices = { goldPricePerGram: gold, silverPricePerGram: silver };
    for (const asset of special) {
      const next = normalizeAsset(asset, prices, parsed.data.currency);
      const amount =
        asset.foreignCurrency && !next.foreignCurrency
          ? asset.foreignAmount ?? asset.amount // now held in the base currency
          : next.amount;
      if (amount !== asset.amount || next.foreignCurrency !== asset.foreignCurrency) {
        statements.push(
          db
            .update(assets)
            .set({ ...next, amount })
            .where(and(eq(assets.id, asset.id), eq(assets.userId, user.id))),
        );
      }
    }
  }

  await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  return NextResponse.json({ ok: true });
}
