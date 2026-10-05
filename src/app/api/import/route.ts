import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { z } from "zod";
import { db } from "@/db";
import {
  assets,
  liabilities,
  givingRecords,
  settings,
  yearSnapshots,
} from "@/db/schema";
import { MAX_BACKUP_BYTES, ROW_LIMITS, errorJson, readJson, writableUser } from "@/lib/api";
import {
  assetSchema,
  currencySchema,
  firstIssue,
  isoDaySchema,
  liabilitySchema,
  givingSchema,
  settingsSchema,
} from "@/lib/validation";
import { snapshotPayloadSchema } from "@/lib/snapshot";
import { normalizeAsset } from "@/lib/asset-write";

const snapshotBackupSchema = z.object({
  label: z.string().trim().min(1).max(80),
  takenAt: isoDaySchema,
  currency: currencySchema,
  // Stored as a JSON string; validated as a real payload so a hand-edited
  // backup cannot plant a snapshot that breaks the pages rendering it.
  payload: z
    .string()
    .max(500_000)
    .refine((raw) => {
      try {
        return snapshotPayloadSchema.safeParse(JSON.parse(raw)).success;
      } catch {
        return false;
      }
    }, "A frozen year in this backup is damaged."),
});

const backupSchema = z.object({
  app: z.literal("mizan").optional(),
  version: z.number().optional(),
  settings: settingsSchema,
  assets: z.array(assetSchema).max(ROW_LIMITS.assets),
  liabilities: z.array(liabilitySchema).max(ROW_LIMITS.liabilities),
  giving: z.array(givingSchema).max(ROW_LIMITS.giving),
  snapshots: z.array(snapshotBackupSchema).max(ROW_LIMITS.snapshots).optional(),
});

/** Rows per INSERT, well under SQLite's bound-parameter limit. */
const CHUNK = 200;

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

export async function POST(request: Request) {
  const { user, response } = await writableUser();
  if (response) return response;

  const body = await readJson(request, MAX_BACKUP_BYTES);
  if (body === null) {
    return errorJson("This file is not a Mizan backup, or it is larger than 8 MB.", 400);
  }
  const parsed = backupSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson(firstIssue(parsed.error, "This file is not a Mizan backup."), 400);
  }

  const data = parsed.data;
  const { touchMetals: _touch, ...settingsFields } = data.settings;
  const settingValues = {
    ...settingsFields,
    // Restoring a ledger means setup is done; older backups omit the flag.
    setupComplete: data.settings.setupComplete ?? true,
    trustedAckAt: data.settings.trustedAckAt ?? null,
    metalsUpdatedAt: data.settings.metalsUpdatedAt ?? null,
    updatedAt: new Date().toISOString(),
  };
  const prices = {
    goldPricePerGram: settingValues.goldPricePerGram,
    silverPricePerGram: settingValues.silverPricePerGram,
  };

  const assetRows = data.assets.map((row) => ({
    userId: user.id,
    ...row,
    ...normalizeAsset(row, prices, settingValues.currency),
  }));
  const liabilityRows = data.liabilities.map((row) => ({ userId: user.id, ...row }));
  const givingRows = data.giving.map((row) => ({
    userId: user.id,
    ...row,
    asnaf: row.type === "zakat" ? row.asnaf ?? null : null,
  }));
  const snaps = data.snapshots ?? [];
  const snapshotRows = snaps.map((s) => ({ userId: user.id, ...s }));

  // One batch is one transaction: the old ledger is only removed if every
  // row of the backup lands. A failure part-way leaves the account untouched.
  const statements: BatchItem<"sqlite">[] = [
    db.delete(assets).where(eq(assets.userId, user.id)),
    db.delete(liabilities).where(eq(liabilities.userId, user.id)),
    db.delete(givingRecords).where(eq(givingRecords.userId, user.id)),
    db.delete(yearSnapshots).where(eq(yearSnapshots.userId, user.id)),
    db
      .insert(settings)
      .values({ userId: user.id, ...settingValues })
      .onConflictDoUpdate({ target: settings.userId, set: settingValues }),
    ...chunks(assetRows).map((rows) => db.insert(assets).values(rows)),
    ...chunks(liabilityRows).map((rows) => db.insert(liabilities).values(rows)),
    ...chunks(givingRows).map((rows) => db.insert(givingRecords).values(rows)),
    ...chunks(snapshotRows).map((rows) => db.insert(yearSnapshots).values(rows)),
  ];
  await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);

  return NextResponse.json({
    ok: true,
    assets: assetRows.length,
    liabilities: liabilityRows.length,
    giving: givingRows.length,
    snapshots: snapshotRows.length,
  });
}
