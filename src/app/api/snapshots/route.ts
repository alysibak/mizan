import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assets, liabilities, givingRecords, yearSnapshots } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { calculateZakat } from "@/lib/zakat";
import type { SnapshotPayload } from "@/lib/snapshot";
import { paymentWindow, sumZakatInWindow, dateInWindow } from "@/lib/giving-window";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  letterToNextYear: z.string().trim().max(2000).optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid label" }, { status: 400 });
  }

  const settings = await getUserSettings(user.id);
  const [assetRows, liabilityRows, givingRows] = await Promise.all([
    db.select().from(assets).where(eq(assets.userId, user.id)),
    db.select().from(liabilities).where(eq(liabilities.userId, user.id)),
    db.select().from(givingRecords).where(eq(givingRecords.userId, user.id)),
  ]);

  const result = calculateZakat({
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
    prices: {
      goldPricePerGram: settings.goldPricePerGram,
      silverPricePerGram: settings.silverPricePerGram,
    },
    standard: settings.nisabStandard as "gold" | "silver",
    basis: settings.calendarBasis as "lunar" | "solar",
  });

  const window = paymentWindow(settings.hawlStartDate);
  const sumType = (type: string) =>
    givingRows
      .filter((g) => g.type === type && dateInWindow(g.date, window))
      .reduce((t, g) => t + g.amount, 0);

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
      year: Number(window.start.slice(0, 4)),
      windowKind: window.kind,
      windowStart: window.start,
      windowEnd: window.end,
      windowLabel: window.label,
      zakat: sumType("zakat"),
      sadaqah: sumType("sadaqah"),
      purification: sumType("purification"),
    },
    letterToNextYear: parsed.data.letterToNextYear?.trim() || null,
  };

  const takenAt = new Date().toISOString().slice(0, 10);
  const label =
    parsed.data.label?.trim() ||
    (window.kind === "hawl"
      ? `Hawl ${window.start}`
      : `Zakat ${window.start.slice(0, 4)}`);

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
