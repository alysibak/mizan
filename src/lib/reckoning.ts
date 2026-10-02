import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  assets,
  liabilities,
  givingRecords,
  yearSnapshots,
  type Asset,
  type GivingRecord,
  type Liability,
  type Settings,
} from "@/db/schema";
import { getUserSettings } from "./session";
import { calculateZakat, type ZakatResult } from "./zakat";
import { hawlStatus, type HawlStatus } from "./hijri";
import { parseSnapshotPayload, type SnapshotPayload } from "./snapshot";
import {
  closedThroughFromFreezes,
  dateInWindow,
  duePhase,
  freezeCoversWindow,
  outstandingZakat,
  paymentWindow,
  sumZakatInWindow,
  type DuePhase,
  type FreezeWindow,
  type PaymentWindow,
} from "./giving-window";

/** Freezes consulted to find the cycle already closed. A handful is plenty. */
const RECENT_FREEZES = 12;

export interface LatestFreeze {
  id: string;
  label: string;
  takenAt: string;
  payload: SnapshotPayload | null;
}

export interface Reckoning {
  settings: Settings;
  assets: Asset[];
  liabilities: Liability[];
  /** Newest first. */
  giving: GivingRecord[];
  result: ZakatResult;
  window: PaymentWindow;
  /** Zakat recorded inside the payment window. */
  zakatPaid: number;
  /** Zakat still to pay this cycle, to the cent. */
  outstanding: number;
  phase: DuePhase;
  hawl: HawlStatus | null;
  latestFreeze: LatestFreeze | null;
  /** Most recent freezes, newest first, with parsed payloads. */
  recentFreezes: LatestFreeze[];
  /** True when the latest freeze closed the cycle shown now. */
  frozenThisCycle: boolean;
}

export function zakatInputFrom(
  settings: Settings,
  assetRows: Pick<Asset, "category" | "label" | "amount" | "zakatablePortion">[],
  liabilityRows: Pick<Liability, "label" | "amount" | "deductible">[],
) {
  return {
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
    standard: settings.nisabStandard === "gold" ? ("gold" as const) : ("silver" as const),
    basis: settings.calendarBasis === "solar" ? ("solar" as const) : ("lunar" as const),
  };
}

function freezeWindow(takenAt: string, payload: SnapshotPayload | null): FreezeWindow {
  return {
    takenAt,
    windowKind: payload?.givingYtd.windowKind,
    cycleStart: payload?.givingYtd.cycleStart,
    windowStart: payload?.givingYtd.windowStart,
    windowEnd: payload?.givingYtd.windowEnd,
  };
}

/**
 * Everything a reckoning screen needs for one user, computed one way: the
 * ledger, the zakat result, the payment window for the current cycle, what is
 * paid and outstanding, and whether this cycle is already frozen.
 */
export async function loadReckoning(
  userId: string,
  today: Date = new Date(),
): Promise<Reckoning> {
  const [settings, assetRows, liabilityRows, givingRows, freezeRows] =
    await Promise.all([
      getUserSettings(userId),
      db
        .select()
        .from(assets)
        .where(eq(assets.userId, userId))
        .orderBy(desc(assets.createdAt)),
      db
        .select()
        .from(liabilities)
        .where(eq(liabilities.userId, userId))
        .orderBy(desc(liabilities.createdAt)),
      db
        .select()
        .from(givingRecords)
        .where(eq(givingRecords.userId, userId))
        .orderBy(desc(givingRecords.date), desc(givingRecords.createdAt)),
      db
        .select({
          id: yearSnapshots.id,
          label: yearSnapshots.label,
          takenAt: yearSnapshots.takenAt,
          payload: yearSnapshots.payload,
        })
        .from(yearSnapshots)
        .where(eq(yearSnapshots.userId, userId))
        .orderBy(desc(yearSnapshots.takenAt), desc(yearSnapshots.createdAt))
        .limit(RECENT_FREEZES),
    ]);

  const result = calculateZakat(zakatInputFrom(settings, assetRows, liabilityRows));

  const freezes = freezeRows.map((row) => ({
    ...row,
    payload: parseSnapshotPayload(row.payload),
  }));
  const closedThrough = closedThroughFromFreezes(
    freezes.map((f) => freezeWindow(f.takenAt, f.payload)),
    settings.hawlStartDate,
  );
  const window = paymentWindow(settings.hawlStartDate, today, closedThrough);
  const zakatPaid = sumZakatInWindow(givingRows, window);

  const latest = freezes[0] ?? null;
  const frozenThisCycle = latest
    ? freezeCoversWindow(freezeWindow(latest.takenAt, latest.payload), window)
    : false;

  return {
    settings,
    assets: assetRows,
    liabilities: liabilityRows,
    giving: givingRows,
    result,
    window,
    zakatPaid,
    outstanding: outstandingZakat(result.zakatDue, zakatPaid),
    phase: duePhase({
      meetsNisab: result.isDue,
      hawlStartDate: settings.hawlStartDate,
      today,
    }),
    hawl: settings.hawlStartDate ? hawlStatus(settings.hawlStartDate, today) : null,
    latestFreeze: latest,
    recentFreezes: freezes,
    frozenThisCycle,
  };
}

/** Sum of one giving type inside the payment window. */
export function sumTypeInWindow(
  rows: Pick<GivingRecord, "type" | "amount" | "date">[],
  type: string,
  window: Pick<PaymentWindow, "start" | "end">,
): number {
  return rows
    .filter((g) => g.type === type && dateInWindow(g.date, window))
    .reduce((t, g) => t + g.amount, 0);
}
