import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { yearSnapshots } from "@/db/schema";
import { errorJson, overRowLimit, readJson, signedInUser, writableUser } from "@/lib/api";
import { loadReckoning, sumTypeInWindow } from "@/lib/reckoning";
import type { SnapshotPayload } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  letterToNextYear: z.string().trim().max(2000).optional().nullable(),
});

export async function GET() {
  const { user, response } = await signedInUser();
  if (response) return response;

  const rows = await db
    .select({
      id: yearSnapshots.id,
      label: yearSnapshots.label,
      takenAt: yearSnapshots.takenAt,
      currency: yearSnapshots.currency,
      createdAt: yearSnapshots.createdAt,
    })
    .from(yearSnapshots)
    .where(eq(yearSnapshots.userId, user.id))
    .orderBy(desc(yearSnapshots.takenAt));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;

  // An empty body is fine: every field is optional.
  const parsed = createSchema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) return errorJson("Invalid label", 400);
  const full = await overRowLimit("snapshots", user.id);
  if (full) return full;

  const {
    settings,
    assets: assetRows,
    liabilities: liabilityRows,
    giving: givingRows,
    result,
    window,
    today,
  } = await loadReckoning(user.id);

  const payload: SnapshotPayload = {
    version: 1,
    settings: {
      currency: settings.currency,
      nisabStandard: settings.nisabStandard,
      calendarBasis: settings.calendarBasis,
      goldPricePerGram: settings.goldPricePerGram,
      silverPricePerGram: settings.silverPricePerGram,
      hawlStartDate: settings.hawlStartDate,
      madhhab: settings.madhhab,
    },
    assets: assetRows.map((a) => ({
      category: a.category,
      label: a.label,
      amount: a.amount,
      zakatablePortion: a.zakatablePortion,
    })),
    liabilities: liabilityRows.map((l) => ({
      label: l.label,
      amount: l.amount,
      deductible: l.deductible,
    })),
    result: {
      grossZakatable: result.grossZakatable,
      deductibleLiabilities: result.deductibleLiabilities,
      netZakatable: result.netZakatable,
      nisab: result.nisab,
      goldNisab: result.goldNisab,
      silverNisab: result.silverNisab,
      rate: result.rate,
      basis: result.basis,
      zakatDue: result.zakatDue,
      isDue: result.isDue,
      marginToNisab: result.marginToNisab,
    },
    givingYtd: {
      year: Number(window.cycleStart.slice(0, 4)),
      windowKind: window.kind,
      cycleStart: window.cycleStart,
      windowStart: window.start,
      windowEnd: window.end,
      windowLabel: window.label,
      zakat: sumTypeInWindow(givingRows, "zakat", window),
      sadaqah: sumTypeInWindow(givingRows, "sadaqah", window),
      purification: sumTypeInWindow(givingRows, "purification", window),
      fitr: sumTypeInWindow(givingRows, "fitr", window),
    },
    letterToNextYear: parsed.data.letterToNextYear?.trim() || null,
  };

  const takenAt = today.toISOString().slice(0, 10);
  const label =
    parsed.data.label?.trim() ||
    (window.kind === "hawl"
      ? `Hawl ${window.cycleStart}`
      : `Zakat ${window.cycleStart.slice(0, 4)}`);

  const [row] = await db
    .insert(yearSnapshots)
    .values({
      userId: user.id,
      label,
      takenAt,
      currency: settings.currency,
      payload: JSON.stringify(payload),
    })
    .returning({
      id: yearSnapshots.id,
      label: yearSnapshots.label,
      takenAt: yearSnapshots.takenAt,
    });

  return NextResponse.json(row, { status: 201 });
}
