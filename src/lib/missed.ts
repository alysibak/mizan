/**
 * Catching up on zakat missed in past years. Each year with savings at or
 * above the nisab owed 2.5% of what was held on that year's zakat day, and
 * what was not paid is still owed. Amounts are the person's own estimates.
 *
 * Some scholars take each year's unpaid zakat off the next year's savings
 * (it is a debt), which lowers the total slightly. This tally does not, so it
 * errs on the side of being sure the debt is covered.
 */

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
