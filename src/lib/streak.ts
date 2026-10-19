/** Days as local calendar dates, "YYYY-MM-DD". */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/**
 * Days in a row ending today, or ending yesterday if today is not marked
 * yet (so a streak does not look broken before the day is over).
 */
export function streak(days: ReadonlySet<string>, today: Date): number {
  let d = days.has(dayKey(today)) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** How many marked days fall in the month of `day`. */
export function monthCount(days: ReadonlySet<string>, day: Date): number {
  const prefix = dayKey(day).slice(0, 7);
  let n = 0;
  for (const d of days) if (d.startsWith(prefix)) n++;
  return n;
}

/**
 * The month of `day` as weeks of seven, Monday first, with null for the
 * blanks before the 1st and after the last day.
 */
export function monthGrid(day: Date): (Date | null)[][] {
  const first = new Date(day.getFullYear(), day.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const length = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length }, (_, i) => new Date(day.getFullYear(), day.getMonth(), i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/** Where the good-deed days are kept in the browser. */
export const DEED_DAYS_KEY = "mizan-sadaqah-days-v1";

/** The days kept in this browser, or none if nothing (or nonsense) was. */
export function parseDays(raw: string | null): Set<string> {
  try {
    const v: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(v) ? v.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) : [],
    );
  } catch {
    return new Set();
  }
}
