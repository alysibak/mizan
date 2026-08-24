// Hijri (Islamic lunar) calendar helpers, used for hawl tracking.
//
// Hawl is the requirement that zakatable wealth be held for one full lunar year
// before zakat falls due. To track that, we convert between the Gregorian and
// the tabular Islamic calendar using integer Julian Day Numbers. The tabular
// calendar is arithmetic, so it can differ from a moon-sighting by a day or two.
// That is fine for a "days until your zakat is due" indicator; for the exact day
// of payment, follow your local sighting.

export const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Shaban",
  "Ramadan",
  "Shawwal",
  "Dhul-Qadah",
  "Dhul-Hijjah",
] as const;

export interface HijriDate {
  year: number;
  month: number; // 1..12
  day: number; // 1..30
}

function gregorianToJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d2 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d2) / 4);
  const m2 = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m2 + 2) / 5) + 1;
  const month = m2 + 3 - 12 * Math.floor(m2 / 10);
  const year = 100 * b + d2 - 4800 + Math.floor(m2 / 10);
  return { year, month, day };
}

// Tabular Islamic calendar (civil epoch: 1 Muharram 1 AH = JDN 1948440).
function islamicToJDN(y: number, m: number, d: number): number {
  return (
    d +
    Math.ceil(29.5 * (m - 1)) +
    (y - 1) * 354 +
    Math.floor((3 + 11 * y) / 30) +
    1948439
  );
}

function jdnToIslamic(jdn: number): HijriDate {
  const year = Math.floor((30 * (jdn - 1948440) + 10646) / 10631);
  let month = 1;
  while (month < 12 && islamicToJDN(year, month + 1, 1) <= jdn) {
    month++;
  }
  const day = jdn - islamicToJDN(year, month, 1) + 1;
  return { year, month, day };
}

/** Parse an ISO date (YYYY-MM-DD or full ISO) into UTC y/m/d, avoiding TZ drift. */
function ymdUTC(iso: string): { y: number; m: number; d: number } {
  const dt = new Date(iso);
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
  };
}

export function gregorianToHijri(date: Date | string): HijriDate {
  const iso = typeof date === "string" ? date : date.toISOString();
  const { y, m, d } = ymdUTC(iso);
  return jdnToIslamic(gregorianToJDN(y, m, d));
}

export function hijriToGregorian(h: HijriDate): Date {
  const { year, month, day } = jdnToGregorian(islamicToJDN(h.year, h.month, h.day));
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatHijri(date: Date | string): string {
  const h = gregorianToHijri(date);
  return `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} AH`;
}

const MS_PER_DAY = 86_400_000;

export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / MS_PER_DAY);
}

/** The Gregorian date one Hijri year after the given start date. */
export function hawlDueDate(start: Date | string): Date {
  const h = gregorianToHijri(start);
  return hijriToGregorian({ year: h.year + 1, month: h.month, day: h.day });
}

export interface HawlStatus {
  startDate: Date;
  dueDate: Date;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  /** 0..1 progress through the holding year. */
  progress: number;
  isComplete: boolean;
}

export function hawlStatus(start: Date | string, today: Date = new Date()): HawlStatus {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const dueDate = hawlDueDate(startDate);
  const totalDays = Math.max(1, daysBetween(startDate, dueDate));
  const elapsedDays = Math.max(0, daysBetween(startDate, today));
  const remainingDays = Math.max(0, daysBetween(today, dueDate));
  const progress = Math.min(1, elapsedDays / totalDays);
  return {
    startDate,
    dueDate,
    totalDays,
    elapsedDays,
    remainingDays,
    progress,
    isComplete: remainingDays === 0,
  };
}
