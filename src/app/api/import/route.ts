import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  assets,
  liabilities,
  givingRecords,
  settings,
  yearSnapshots,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import {
  assetSchema,
  liabilitySchema,
  givingSchema,
  settingsSchema,
} from "@/lib/validation";

const snapshotBackupSchema = z.object({
  label: z.string().trim().min(1).max(80),
  takenAt: z.string().min(1),
  currency: z.string().trim().min(3).max(3),
  payload: z.string().min(2),
});

const backupSchema = z.object({
  app: z.literal("mizan").optional(),
  version: z.number().optional(),
  settings: settingsSchema,
  assets: z.array(assetSchema).max(500),
  liabilities: z.array(liabilitySchema).max(500),
  giving: z.array(givingSchema).max(2000),
  snapshots: z.array(snapshotBackupSchema).max(200).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = backupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "This file is not a Mizan backup." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const { touchMetals: _touch, ...settingsFields } = data.settings;
  const settingValues = {
    ...settingsFields,
    currency: data.settings.currency.toUpperCase(),
    hawlStartDate: data.settings.hawlStartDate || null,
    madhhab: data.settings.madhhab ?? "general",
    // Restoring a ledger means setup is done; older backups omit the flag.
    setupComplete: data.settings.setupComplete ?? true,
    trustedAckAt: data.settings.trustedAckAt ?? null,
    metalsUpdatedAt: data.settings.metalsUpdatedAt ?? null,
    updatedAt: new Date().toISOString(),
  };

  await db.delete(assets).where(eq(assets.userId, user.id));
  await db.delete(liabilities).where(eq(liabilities.userId, user.id));
  await db.delete(givingRecords).where(eq(givingRecords.userId, user.id));
  await db.delete(yearSnapshots).where(eq(yearSnapshots.userId, user.id));

  await db
    .insert(settings)
    .values({ userId: user.id, ...settingValues })
    .onConflictDoUpdate({ target: settings.userId, set: settingValues });

  if (data.assets.length) {
    await db.insert(assets).values(
      data.assets.map((row) => ({
        userId: user.id,
        ...row,
        hawlStartDate: row.hawlStartDate || null,
        note: row.note || null,
      })),
    );
  }
  if (data.liabilities.length) {
    await db
      .insert(liabilities)
      .values(data.liabilities.map((row) => ({ userId: user.id, ...row })));
  }
  if (data.giving.length) {
    await db.insert(givingRecords).values(
      data.giving.map((row) => ({
        userId: user.id,
        ...row,
        asnaf: row.type === "zakat" ? row.asnaf || null : null,
        recipient: row.recipient || null,
        note: row.note || null,
      })),
    );
  }
  const snaps = data.snapshots ?? [];
  if (snaps.length) {
    await db.insert(yearSnapshots).values(
      snaps.map((s) => ({
        userId: user.id,
        label: s.label,
        takenAt: s.takenAt,
        currency: s.currency.toUpperCase(),
        payload: s.payload,
      })),
    );
  }

  return NextResponse.json({
    ok: true,
    assets: data.assets.length,
    liabilities: data.liabilities.length,
    giving: data.giving.length,
    snapshots: snaps.length,
  });
}
