/**
 * Spreading a gift over the last ten nights of Ramadan, so some of it is
 * sure to fall on Laylat al-Qadr, which is sought in the odd nights. Nothing
 * is paid here: this is a plan with a reminder for each night.
 */

import { toCents } from "./money";

const DAY = 86_400_000;

export interface Night {
  /** The night of Ramadan, 21 to 29 or 30. */
  night: number;
  /** The Gregorian date of the evening it begins (YYYY-MM-DD). */
  evening: string;
  odd: boolean;
  amount: number;
}

export const MAX_ODD_WEIGHT = 3;

/**
 * The plan for `total`, given the first day of Ramadan and the day of Eid.
 * Night n begins on the evening of day n − 1. Odd nights get `oddWeight`
 * shares to the even nights' one. Amounts are whole cents and add up to the
 * total exactly; any cent left over goes to the 27th night (or the last).
 * `from` skips nights already past, for a plan made during Ramadan.
 */
export function tenNightsPlan(total: number, start: Date, eid: Date, oddWeight = 1, from = 21): Night[] {
  if (!(total > 0) || !Number.isFinite(total)) return [];
  const weight = Math.max(1, Math.min(MAX_ODD_WEIGHT, Math.round(oddWeight)));
  const days = Math.round((eid.getTime() - start.getTime()) / DAY);
  const last = days >= 30 ? 30 : 29;
  const nights: Night[] = [];
  for (let n = Math.max(21, Math.floor(from)); n <= last; n++) {
    const evening = new Date(start.getTime() + (n - 2) * DAY).toISOString().slice(0, 10);
    nights.push({ night: n, evening, odd: n % 2 === 1, amount: 0 });
  }
  if (nights.length === 0) return [];
  const cents = Math.round(toCents(total) * 100);
  const shares = nights.reduce((sum, n) => sum + (n.odd ? weight : 1), 0);
  let given = 0;
  for (const n of nights) {
    n.amount = Math.floor((cents * (n.odd ? weight : 1)) / shares) / 100;
    given += Math.round(n.amount * 100);
  }
  const night27 = nights.find((n) => n.night === 27) ?? nights[nights.length - 1];
  night27.amount = toCents(night27.amount + (cents - given) / 100);
  return nights;
}
