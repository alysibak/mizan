import { hawlDueDate, hawlStatus } from "./hijri";
import { addDays, isoDay } from "./dates";
import { toCents } from "./money";

export type PaymentWindowKind = "hawl" | "gregorian";

export interface PaymentWindow {
  kind: PaymentWindowKind;
  /**
   * First day of the cycle this window belongs to: the ledger hawl start, or
   * 1 January when no hawl is set. Identifies the cycle across freezes.
   */
  cycleStart: string;
  /** Inclusive start YYYY-MM-DD (UTC date string compare works for ISO dates). */
  start: string;
  /** Inclusive end YYYY-MM-DD. */
  end: string;
  /** Short label for UI. */
  label: string;
  /** Longer explanation. */
  detail: string;
}

/**
 * Window used to sum zakat payments toward “outstanding.”
 * Prefer the current hawl cycle when a start date exists; otherwise calendar year,
 * labeled honestly so it is not confused with the lunar year.
 *
 * `closedThrough` is the last day already accounted to a previous, frozen
 * cycle (see `closedThroughFromFreezes`). Zakat paid after a hawl falls due
 * belongs to that cycle, so it must not also reduce the next one.
 */
export function paymentWindow(
  hawlStartDate: string | null | undefined,
  today: Date = new Date(),
  closedThrough?: string | null,
): PaymentWindow {
  if (hawlStartDate) {
    const status = hawlStatus(hawlStartDate, today);
    const cycleStart = isoDay(status.startDate);
    // Keep the window open through today so payments after the tabular due day
    // still clear this cycle’s outstanding balance.
    const endBound =
      today.getTime() > status.dueDate.getTime() ? today : status.dueDate;
    const end = isoDay(endBound);
    let start = cycleStart;
    if (closedThrough && closedThrough >= start) {
      start = addDays(closedThrough, 1);
      if (start > end) start = end;
    }
    const carried =
      start !== cycleStart
        ? ` Payments through ${addDays(start, -1)} were counted toward the cycle you froze before this one.`
        : "";
    return {
      kind: "hawl",
      cycleStart,
      start,
      end,
      label: "This hawl cycle",
      detail: `Zakat payments from ${start} through ${end}. Tabular due day ${isoDay(status.dueDate)}; confirm the payment day with local moon-sighting.${carried}`,
    };
  }

  const y = today.getUTCFullYear();
  return {
    kind: "gregorian",
    cycleStart: `${y}-01-01`,
    start: `${y}-01-01`,
    end: `${y}-12-31`,
    label: "Calendar year (Jan–Dec)",
    detail:
      "No hawl start is set, so paid totals use the Gregorian calendar year — not the lunar holding year.",
  };
}

/** What a freeze recorded about the payment window it summed. */
export interface FreezeWindow {
  takenAt: string;
  windowKind?: PaymentWindowKind;
  cycleStart?: string;
  windowStart?: string;
  windowEnd?: string;
}

/** The cycle a freeze belongs to. Older freezes only stored windowStart. */
function freezeCycle(f: FreezeWindow): string | undefined {
  return f.cycleStart ?? f.windowStart;
}

/**
 * Last day already accounted to an earlier hawl cycle: the window end of the
 * most recent freeze whose cycle started before the current hawl start.
 */
export function closedThroughFromFreezes(
  freezes: FreezeWindow[],
  hawlStartDate: string | null | undefined,
): string | null {
  if (!hawlStartDate) return null;
  const current = hawlStartDate.slice(0, 10);
  let latest: string | null = null;
  for (const f of freezes) {
    const cycle = freezeCycle(f);
    if (f.windowKind !== "hawl" || !cycle || !f.windowEnd) continue;
    if (cycle >= current) continue;
    if (!latest || f.windowEnd > latest) latest = f.windowEnd;
  }
  return latest;
}

/** True when this freeze was taken for the cycle the window describes. */
export function freezeCoversWindow(f: FreezeWindow, window: PaymentWindow): boolean {
  const cycle = freezeCycle(f);
  if (cycle && f.windowKind) {
    return f.windowKind === window.kind && cycle === window.cycleStart;
  }
  // Freezes from before windows were recorded: fall back to the date taken.
  return dateInWindow(f.takenAt, window);
}

/**
 * Zakat still to pay for the cycle, to the cent. Rounding both sides keeps a
 * payment of the displayed figure from leaving a fraction of a cent "owed".
 */
export function outstandingZakat(zakatDue: number, paid: number): number {
  return Math.max(0, toCents(toCents(zakatDue) - toCents(paid)));
}

/** True when an ISO date (YYYY-MM-DD or full) falls in [start, end] inclusive. */
export function dateInWindow(
  date: string,
  window: Pick<PaymentWindow, "start" | "end">,
): boolean {
  const day = date.slice(0, 10);
  return day >= window.start && day <= window.end;
}

export function sumZakatInWindow(
  records: { type: string; amount: number; date: string }[],
  window: Pick<PaymentWindow, "start" | "end">,
): number {
  return records
    .filter((g) => g.type === "zakat" && dateInWindow(g.date, window))
    .reduce((t, g) => t + g.amount, 0);
}

export type DuePhase = "below_nisab" | "indicative" | "payable";

/**
 * Nisab math (`isDue`) is not the same as “pay now.”
 * Payable only when wealth meets nisab AND the ledger hawl is complete
 * (or no hawl is tracked — then we stay indicative and say so).
 */
export function duePhase(opts: {
  meetsNisab: boolean;
  hawlStartDate: string | null | undefined;
  today?: Date;
}): DuePhase {
  if (!opts.meetsNisab) return "below_nisab";
  if (!opts.hawlStartDate) return "indicative";
  const hawl = hawlStatus(opts.hawlStartDate, opts.today);
  return hawl.isComplete ? "payable" : "indicative";
}

export function duePhaseLabel(phase: DuePhase, hasHawlStart = true): string {
  if (phase === "below_nisab") return "Below nisab";
  if (phase === "payable") return "Payable now";
  if (!hasHawlStart) return "Indicative — no hawl start set";
  return "Indicative — hawl not complete";
}

/** Seed defaults from schema / DEFAULT_SETTINGS — treat as unverified starter prices. */
export const DEFAULT_GOLD_PER_GRAM = 90;
export const DEFAULT_SILVER_PER_GRAM = 1.05;

export function metalsLookLikeDefaults(gold: number, silver: number): boolean {
  return (
    Math.abs(gold - DEFAULT_GOLD_PER_GRAM) < 0.0001 &&
    Math.abs(silver - DEFAULT_SILVER_PER_GRAM) < 0.0001
  );
}

/** After this many days, prompt to reconfirm gold/silver even if not defaults. */
export const METALS_STALE_DAYS = 30;

export type MetalsFreshness = {
  stale: boolean;
  reason: "defaults" | "never" | "aged" | null;
  ageDays: number | null;
};

/**
 * Whether stored metal prices should be treated as unverified for nisab trust.
 * Defaults and never-confirmed prices always stale; aged after METALS_STALE_DAYS.
 */
export function metalsFreshness(opts: {
  gold: number;
  silver: number;
  metalsUpdatedAt: string | null | undefined;
  today?: Date;
}): MetalsFreshness {
  const today = opts.today ?? new Date();
  if (metalsLookLikeDefaults(opts.gold, opts.silver)) {
    return { stale: true, reason: "defaults", ageDays: null };
  }
  if (!opts.metalsUpdatedAt) {
    return { stale: true, reason: "never", ageDays: null };
  }
  const then = new Date(opts.metalsUpdatedAt);
  if (Number.isNaN(then.getTime())) {
    return { stale: true, reason: "never", ageDays: null };
  }
  const ageDays = Math.floor(
    (today.getTime() - then.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (ageDays >= METALS_STALE_DAYS) {
    return { stale: true, reason: "aged", ageDays };
  }
  return { stale: false, reason: null, ageDays };
}

/** Re-export for callers that need the next due day without importing hijri. */
export { hawlDueDate };
