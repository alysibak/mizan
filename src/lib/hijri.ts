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

/**
 * Which Hijri calendar to count in. "tabular" is pure arithmetic and works
 * anywhere; "umalqura" follows Saudi Arabia's Umm al-Qura tables (via the
 * browser/Node ICU data), which match many printed calendars more closely.
 * Neither replaces local moon-sighting for the actual day.
 */
export type HijriCalendar = "tabular" | "umalqura";

export function parseHijriCalendar(value: string | null | undefined): HijriCalendar {
  return value === "umalqura" ? "umalqura" : "tabular";
}

export const HIJRI_CALENDAR_LABELS: Record<HijriCalendar, string> = {
  tabular: "Tabular (arithmetic)",
  umalqura: "Umm al-Qura",
};

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

let umalquraFormat: Intl.DateTimeFormat | null | undefined;

/** Umm al-Qura date of a UTC day, or null where ICU lacks the calendar. */
function umalqura(jdn: number): HijriDate | null {
  if (umalquraFormat === undefined) {
    try {
      umalquraFormat = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        timeZone: "UTC",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      if (umalquraFormat.resolvedOptions().calendar !== "islamic-umalqura") {
        umalquraFormat = null;
      }
    } catch {
      umalquraFormat = null;
    }
  }
  if (!umalquraFormat) return null;
  const g = jdnToGregorian(jdn);
  const parts = umalquraFormat.formatToParts(new Date(Date.UTC(g.year, g.month - 1, g.day)));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const h = { year: get("year"), month: get("month"), day: get("day") };
  return Number.isFinite(h.year) && h.month >= 1 && h.day >= 1 ? h : null;
}

function toHijri(jdn: number, calendar: HijriCalendar): HijriDate {
  return (calendar === "umalqura" && umalqura(jdn)) || jdnToIslamic(jdn);
}

function sameDay(a: HijriDate, b: HijriDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** JDN of a Hijri date. Umm al-Qura is found by searching near the tabular day. */
function fromHijri(h: HijriDate, calendar: HijriCalendar): number {
  const tabular = islamicToJDN(h.year, h.month, h.day);
  if (calendar !== "umalqura") return tabular;
  for (const offset of [0, -1, 1, -2, 2, -3, 3]) {
    const found = umalqura(tabular + offset);
    if (found && sameDay(found, h)) return tabular + offset;
  }
  // Day 30 of a 29-day month: the day after the 29th.
  if (h.day === 30) {
    const prev = fromHijri({ ...h, day: 29 }, calendar);
    const next = umalqura(prev + 1);
    if (next && next.day === 1) return prev + 1;
  }
  return tabular;
}

export function gregorianToHijri(
  date: Date | string,
  calendar: HijriCalendar = "tabular",
): HijriDate {
  const iso = typeof date === "string" ? date : date.toISOString();
  const { y, m, d } = ymdUTC(iso);
  return toHijri(gregorianToJDN(y, m, d), calendar);
}

export function hijriToGregorian(
  h: HijriDate,
  calendar: HijriCalendar = "tabular",
): Date {
  const { year, month, day } = jdnToGregorian(fromHijri(h, calendar));
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatHijri(
  date: Date | string,
  calendar: HijriCalendar = "tabular",
): string {
  const h = gregorianToHijri(date, calendar);
  return `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} AH`;
}

const MS_PER_DAY = 86_400_000;

export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / MS_PER_DAY);
}

/** The Gregorian date one Hijri year after the given start date. */
export function hawlDueDate(
  start: Date | string,
  calendar: HijriCalendar = "tabular",
): Date {
  const h = gregorianToHijri(start, calendar);
  return hijriToGregorian({ year: h.year + 1, month: h.month, day: h.day }, calendar);
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

export function hawlStatus(
  start: Date | string,
  today: Date = new Date(),
  calendar: HijriCalendar = "tabular",
): HawlStatus {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const dueDate = hawlDueDate(startDate, calendar);
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
