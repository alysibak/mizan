import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, liabilities, givingRecords, yearSnapshots } from "@/db/schema";
import { getUserSettings } from "@/lib/session";
import { signedInUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await signedInUser();
  if (response) return response;

  const [settings, assetRows, liabilityRows, givingRows, snapRows] = await Promise.all([
    getUserSettings(user.id),
    db.select().from(assets).where(eq(assets.userId, user.id)),
    db.select().from(liabilities).where(eq(liabilities.userId, user.id)),
    db.select().from(givingRecords).where(eq(givingRecords.userId, user.id)),
    db.select().from(yearSnapshots).where(eq(yearSnapshots.userId, user.id)),
  ]);

  const payload = {
    app: "mizan",
    version: 3,
    exportedAt: new Date().toISOString(),
    name: user.name,
    settings: {
      currency: settings.currency,
      nisabStandard: settings.nisabStandard,
      calendarBasis: settings.calendarBasis,
      goldPricePerGram: settings.goldPricePerGram,
      silverPricePerGram: settings.silverPricePerGram,
      hawlStartDate: settings.hawlStartDate,
      madhhab: settings.madhhab,
      setupComplete: settings.setupComplete,
      trustedAckAt: settings.trustedAckAt,
      metalsUpdatedAt: settings.metalsUpdatedAt,
      hijriCalendar: settings.hijriCalendar,
      timezone: settings.timezone ?? undefined,
    },
    assets: assetRows.map((a) => ({
      category: a.category,
      label: a.label,
      amount: a.amount,
      zakatablePortion: a.zakatablePortion,
      hawlStartDate: a.hawlStartDate,
      note: a.note,
      grams: a.grams,
      purity: a.purity,
      metal: a.metal,
      foreignCurrency: a.foreignCurrency,
      foreignAmount: a.foreignAmount,
      fxRate: a.fxRate,
    })),
    liabilities: liabilityRows.map((l) => ({
      label: l.label,
      amount: l.amount,
      deductible: l.deductible,
    })),
    giving: givingRows.map((g) => ({
      amount: g.amount,
      type: g.type,
      asnaf: g.asnaf,
      recipient: g.recipient,
      note: g.note,
      date: g.date,
    })),
    snapshots: snapRows.map((s) => ({
      label: s.label,
      takenAt: s.takenAt,
      currency: s.currency,
      payload: s.payload,
    })),
  };

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mizan-backup-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
