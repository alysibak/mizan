import { NextResponse } from "next/server";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getUserSettings } from "@/lib/session";
import { firstIssue, settingsSchema } from "@/lib/validation";
import { assetRevaluations } from "@/lib/asset-revalue";
import { errorJson, readJson, signedInUser, writableUser } from "@/lib/api";

export async function GET() {
  const { user, response } = await signedInUser();
  if (response) return response;
  return NextResponse.json(await getUserSettings(user.id));
}

export async function PUT(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;
  const parsed = settingsSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorJson(firstIssue(parsed.error), 400);

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
    statements.push(
      ...(await assetRevaluations(
        user.id,
        { goldPricePerGram: gold, silverPricePerGram: silver },
        parsed.data.currency,
      )),
    );
  }

  await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  return NextResponse.json({ ok: true });
}
