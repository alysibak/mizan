/**
 * Catching up on zakat missed in past years. Each year with savings at or
 * above the nisab owed 2.5% of what was held on that year's zakat day, and
 * what was not paid is still owed. Amounts are the person's own estimates.
 *
 * Some scholars take each year's unpaid zakat off the next year's savings
 * (it is a debt), which lowers the total slightly. This tally does not, so it
 * errs on the side of being sure the debt is covered.
 */

import { parseAmount, type DecimalMark } from "./calculator";
import { toCents } from "./money";

export const MAX_MISSED_YEARS = 60;
export const ZAKAT_RATE = 0.025;
/** Payment plans offered, in months; 1 is all at once. */
export const PLAN_MONTHS = [1, 3, 6, 12, 24] as const;

export interface MissedResult {
  valid: boolean;
  /** Zakat owed for each year, in the order given (most recent first). */
  perYear: number[];
  total: number;
  /** What to set aside each month to finish in `months`; the last month may be a little less. */
  perMonth: number;
}

/** Zakat for each estimated year. Empty or zero years (below the nisab) owe nothing. */
export function missedZakat(amounts: number[], months = 1): MissedResult {
  const none: MissedResult = { valid: false, perYear: [], total: 0, perMonth: 0 };
  if (amounts.length < 1 || amounts.length > MAX_MISSED_YEARS) return none;
  if (!Number.isInteger(months) || months < 1) return none;
  if (amounts.some((a) => !Number.isFinite(a) || a < 0)) return none;
  const perYear = amounts.map((a) => toCents(a * ZAKAT_RATE));
  const total = toCents(perYear.reduce((sum, z) => sum + z, 0));
  if (!(total > 0)) return none;
  // Round each month up to the cent so the plan never falls short.
  const perMonth = Math.ceil((total / months) * 100 - 1e-6) / 100;
  return { valid: true, perYear, total, perMonth };
}

/** Where the catch-up tally is kept in the browser. */
export const MISSED_KEY = "mizan-missed-v1";

export interface Tally {
  years: string;
  same: string;
  different: boolean;
  each: string[];
  months: number;
  given: string;
}

export const EMPTY_TALLY: Tally = { years: "", same: "", different: false, each: [], months: 1, given: "" };

/** What was kept in this browser, or a fresh tally if nothing (or nonsense) was. */
export function parseTally(raw: string | null): Tally {
  if (!raw) return EMPTY_TALLY;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof Tally, unknown>>;
    const text = (x: unknown) => (typeof x === "string" ? x.slice(0, 40) : "");
    return {
      years: text(v.years),
      same: text(v.same),
      different: v.different === true,
      each: Array.isArray(v.each) ? v.each.slice(0, MAX_MISSED_YEARS).map(text) : [],
      months: (PLAN_MONTHS as readonly unknown[]).includes(v.months) ? (v.months as number) : 1,
      given: text(v.given),
    };
  } catch {
    return EMPTY_TALLY;
  }
}

/** Each year's savings from a tally, or none while the number of years is not a whole number in range. */
export function tallyAmounts(tally: Tally, decimal: DecimalMark): number[] {
  const count = Number(tally.years);
  if (!Number.isInteger(count) || count < 1 || count > MAX_MISSED_YEARS) return [];
  return Array.from({ length: count }, (_, i) =>
    parseAmount(tally.different ? (tally.each[i] ?? "") : tally.same, decimal),
  );
}
