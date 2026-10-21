/**
 * "My zakat": one person's zakat year, kept in their own browser. The figures
 * themselves live where they were entered (the calculator draft, the farm,
 * the catch-up tally, …); this keeps what ties them together: the zakat day,
 * the payments made, and a record of past years. Pure, so it is unit-tested.
 */
import { gregorianToHijri, hijriToGregorian, type HijriCalendar } from "./hijri";
import { toCents } from "./money";
import { PHONE_KEYS } from "./phone-features";

export const MY_KEY = "mizan-my-v1";
const CALENDAR: HijriCalendar = "umalqura";

/**
 * Every key Mizan keeps in a visitor's browser, for backing up, restoring and
 * moving to a new phone: the figures, My zakat, and each tool in the registry.
 */
export const BACKUP_KEYS: readonly string[] = ["mizan-calculator-v1", "mizan-visitor-currency", MY_KEY, ...PHONE_KEYS];

export interface ZakatDay {
  /** Hijri month, 1 (Muharram) to 12 (Dhul-Hijjah). */
  month: number;
  /** 1 to 29, so the day exists in every month. */
  day: number;
}

export interface Payment {
  id: string;
  /** YYYY-MM-DD it was given. */
  day: string;
  amount: number;
  /** Who or where, if the visitor wants to note it. */
  to: string;
}

export interface YearRecord {
  /** The Hijri year the zakat day fell in. */
  hijriYear: number;
  currency: string;
  due: number;
  given: number;
  /** YYYY-MM-DD the year was closed. */
  closed: string;
}

export interface MyZakat {
  zakatDay: ZakatDay | null;
  payments: Payment[];
  history: YearRecord[];
}

export const EMPTY_MY: MyZakat = { zakatDay: null, payments: [], history: [] };

const MAX_PAYMENTS = 200;
const MAX_HISTORY = 100;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;
}
function text(v: unknown, max = 60): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

/** What this browser kept, checked piece by piece; anything unreadable is dropped. */
export function parseMy(raw: string | null): MyZakat {
  if (!raw) return EMPTY_MY;
  let v: Record<string, unknown>;
  try {
    v = JSON.parse(raw);
  } catch {
    return EMPTY_MY;
  }
  if (!v || typeof v !== "object") return EMPTY_MY;
  const zd = v.zakatDay as Record<string, unknown> | null | undefined;
  const month = Number(zd?.month);
  const day = Number(zd?.day);
  const zakatDay =
    Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(day) && day >= 1 && day <= 29
      ? { month, day }
      : null;
  const payments = (Array.isArray(v.payments) ? v.payments : [])
    .slice(-MAX_PAYMENTS)
    .map((p: Record<string, unknown>) => ({
      id: text(p?.id, 40),
      day: DAY.test(text(p?.day)) ? text(p?.day) : "",
      amount: num(p?.amount),
      to: text(p?.to),
    }))
    .filter((p: Payment) => p.id && p.day && p.amount > 0);
  const history = (Array.isArray(v.history) ? v.history : [])
    .slice(-MAX_HISTORY)
    .map((h: Record<string, unknown>) => ({
      hijriYear: Number.isInteger(h?.hijriYear) ? (h.hijriYear as number) : 0,
      currency: /^[A-Z]{3}$/.test(text(h?.currency, 3)) ? text(h?.currency, 3) : "USD",
      due: num(h?.due),
      given: num(h?.given),
      closed: DAY.test(text(h?.closed)) ? text(h?.closed) : "",
    }))
    .filter((h: YearRecord) => h.hijriYear > 0 && h.closed);
  return { zakatDay, payments, history };
}

function utcDay(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** The next time the zakat day comes round, today included, as a UTC date. */
export function nextZakatDay(zd: ZakatDay, today: Date): Date {
  const t = utcDay(today);
  const h = gregorianToHijri(t, CALENDAR);
  const thisYear = hijriToGregorian({ year: h.year, month: zd.month, day: zd.day }, CALENDAR);
  return thisYear.getTime() >= t.getTime()
    ? thisYear
    : hijriToGregorian({ year: h.year + 1, month: zd.month, day: zd.day }, CALENDAR);
}

/** The zakat day's next few occurrences, for calendar reminders. */
export function zakatDays(zd: ZakatDay, today: Date, years = 5): Date[] {
  const first = nextZakatDay(zd, today);
  const h = gregorianToHijri(first, CALENDAR);
  return Array.from({ length: years }, (_, i) =>
    hijriToGregorian({ year: h.year + i, month: zd.month, day: zd.day }, CALENDAR),
  );
}

/** Days from today to a UTC date. */
export function daysUntil(date: Date, today: Date): number {
  return Math.round((date.getTime() - utcDay(today).getTime()) / 86_400_000);
}

/** The Hijri year a date falls in. */
export function hijriYearOf(date: Date): number {
  return gregorianToHijri(utcDay(date), CALENDAR).year;
}

export function paymentsTotal(payments: Payment[]): number {
  return toCents(payments.reduce((sum, p) => sum + p.amount, 0));
}

/** A payment added to the list, with an id that will not clash. */
export function addPayment(my: MyZakat, p: Omit<Payment, "id">, now = Date.now()): MyZakat {
  const id = `p${now.toString(36)}${my.payments.length}`;
  return { ...my, payments: [...my.payments, { ...p, amount: toCents(p.amount), id }].slice(-MAX_PAYMENTS) };
}

export function removePayment(my: MyZakat, id: string): MyZakat {
  return { ...my, payments: my.payments.filter((p) => p.id !== id) };
}

/** This year written into the record, ready for the next one. */
export function closeYear(
  my: MyZakat,
  year: { hijriYear: number; currency: string; due: number; given: number },
  today: Date,
): MyZakat {
  const closed = utcDay(today).toISOString().slice(0, 10);
  const record = { ...year, due: toCents(year.due), given: toCents(year.given), closed };
  return {
    ...my,
    payments: [],
    history: [...my.history.filter((h) => h.hijriYear !== year.hijriYear), record].slice(-MAX_HISTORY),
  };
}

/** A snapshot of everything kept, for the to-do list. */
export interface Snapshot {
  zakatDay: ZakatDay | null;
  /** This year's zakat from the calculator or guide; null if not worked out. */
  zakat: {
    due: number;
    given: number;
    pricesAgeDays: number | null;
    /** On a monthly plan: a share is due now, or this month's is given. */
    plan?: "now" | "later";
  } | null;
  missedLeft: number;
  interestToGive: number;
  farmDue: boolean;
  /** Days until Ramadan, or 0 during it. */
  ramadanIn: number;
  /** Signed in: their ledger keeps this year's zakat. */
  signedIn?: boolean;
  /** Days since a zakat day that is not yet closed (see overdueDays). */
  overdueDays?: number | null;
  /** Missed fasts still to make up, and fidya or oath food still to give. */
  fastsLeft?: number;
  fastsToGive?: number;
}

export interface Todo {
  key: string;
  text: string;
  href: string;
  /** Lower comes first. */
  rank: number;
}

/** What to do next, most pressing first. Words are English for now. */
export function todos(s: Snapshot, today: Date): Todo[] {
  const list: Todo[] = [];
  if (!s.zakat && s.signedIn) {
    list.push({ key: "ledger", text: "See this year’s zakat in your ledger", href: "/dashboard", rank: 1 });
  } else if (!s.zakat) {
    list.push({ key: "work", text: "Work out this year’s zakat", href: "/guide", rank: 1 });
  } else {
    const left = s.zakat.due - s.zakat.given;
    if (s.zakat.pricesAgeDays !== null && s.zakat.pricesAgeDays > 14) {
      list.push({ key: "prices", text: "Gold and silver prices have moved: check your figures", href: "/calculator", rank: 2 });
    }
    const overdue = s.overdueDays ?? 0;
    if (left > 0.005 && overdue > 0) {
      list.push({
        key: "give",
        text: `Your zakat day was ${overdue} ${overdue === 1 ? "day" : "days"} ago: give what is left now`,
        href: "#given",
        rank: 0,
      });
    } else if (left > 0.005 && s.zakat.plan !== "later") {
      const text = s.zakat.plan === "now" ? "Give this month’s share of your zakat" : "Give what is left of this year’s zakat";
      list.push({ key: "give", text, href: "#given", rank: 3 });
    }
  }
  if (s.interestToGive > 0) {
    list.push({ key: "interest", text: "Give away the bank interest you set aside", href: "/interest", rank: 4 });
  }
  if (!s.zakatDay) {
    list.push({ key: "day", text: "Choose your zakat day, so it comes round each year", href: "#zakat-day", rank: 5 });
  } else {
    const days = daysUntil(nextZakatDay(s.zakatDay, today), today);
    if (days <= 14) {
      list.push({
        key: "soon",
        text: days === 0 ? "Today is your zakat day: update your figures" : `Your zakat day is in ${days} ${days === 1 ? "day" : "days"}: update your figures`,
        href: "/calculator",
        rank: 0,
      });
    }
  }
  if (s.missedLeft > 0.005) list.push({ key: "missed", text: "Keep paying off past years", href: "/missed-years", rank: 6 });
  if (s.farmDue) list.push({ key: "farm", text: "Give the share of your harvest or herd", href: "/farm", rank: 7 });
  const fasts = s.fastsLeft ?? 0;
  if (fasts > 0) {
    // Fasts are made up before the next Ramadan; close to it, they come first.
    list.push({
      key: "fasts",
      text: `Make up ${fasts} missed ${fasts === 1 ? "fast" : "fasts"} before Ramadan`,
      href: "/fasts",
      rank: s.ramadanIn > 0 && s.ramadanIn <= 60 ? 2 : 6,
    });
  } else if ((s.fastsToGive ?? 0) > 0.005) {
    list.push({ key: "fasts", text: "Give the fidya for fasts you cannot make up", href: "/fasts", rank: 6 });
  }
  if (s.ramadanIn === 0) {
    list.push({ key: "fitr", text: "Give Zakat al-Fitr before the Eid prayer", href: "/zakat-al-fitr", rank: 1 });
  } else if (s.ramadanIn <= 30) {
    list.push({ key: "ramadan", text: `Ramadan is in ${s.ramadanIn} days: plan your giving`, href: "/ramadan", rank: 5 });
  }
  return list.sort((a, b) => a.rank - b.rank);
}

/** Everything kept, as one file to save. */
export function backupFile(read: (key: string) => string | null, now: Date): string {
  const data: Record<string, string> = {};
  for (const key of BACKUP_KEYS) {
    const v = read(key);
    if (v !== null) data[key] = v;
  }
  return JSON.stringify({ mizan: 1, saved: now.toISOString(), data }, null, 1);
}

/** The keys and values in a backup file, or null if it is not one. Only Mizan's own keys are accepted. */
export function readBackup(file: string): Record<string, string> | null {
  try {
    const v = JSON.parse(file) as { mizan?: unknown; data?: Record<string, unknown> };
    if (v?.mizan !== 1 || !v.data || typeof v.data !== "object") return null;
    const out: Record<string, string> = {};
    for (const key of BACKUP_KEYS) {
      const value = v.data[key];
      if (typeof value === "string" && value.length <= 200_000) out[key] = value;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

/** A number written the way the figures were typed, so it reads back the same. */
export function draftAmount(n: number, decimal: "." | "," | null): string {
  const s = String(toCents(n));
  return decimal === "," ? s.replace(".", ",") : s;
}

/** The most recent zakat day, today included: when the current year began. */
export function lastZakatDay(zd: ZakatDay, today: Date): Date {
  const next = nextZakatDay(zd, today);
  if (daysUntil(next, today) === 0) return next;
  const h = gregorianToHijri(next, CALENDAR);
  return hijriToGregorian({ year: h.year - 1, month: zd.month, day: zd.day }, CALENDAR);
}

/**
 * What is left, spread over the months before the zakat day: a share today
 * (or next month, if this month's is given) and on the same date each month, in whole units so it is easy to
 * remember, with the last share taking the difference. Empty when there is
 * less than two months to go: then it is simply given.
 */
export function monthlyPlan(
  left: number,
  due: Date,
  today: Date,
  /** This month's share is already given: start next month. */
  givenThisMonth = false,
): { day: string; amount: number }[] {
  const t = utcDay(today);
  const days: Date[] = [];
  for (let k = givenThisMonth ? 1 : 0; k < 13; k++) {
    const day = k === 0 ? t.getUTCDate() : Math.min(t.getUTCDate(), 28);
    const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + k, day));
    if (d.getTime() >= due.getTime()) break;
    days.push(d);
  }
  if (days.length < 2 || !(left > 0)) return [];
  const per = Math.ceil(left / days.length);
  const n = Math.min(days.length, Math.ceil(left / per));
  if (n < 2) return [];
  return days.slice(0, n).map((d, i) => ({
    day: d.toISOString().slice(0, 10),
    amount: i < n - 1 ? per : toCents(left - per * (n - 1)),
  }));
}

/**
 * Days since the zakat day passed with the year not yet closed: zakat due
 * then is owed now, not something to spread over months. Null once the year
 * is closed, with no zakat day, or long after it (by then the figures are
 * for the next one).
 */
export function overdueDays(my: MyZakat, today: Date, window = 60): number | null {
  if (!my.zakatDay) return null;
  const last = lastZakatDay(my.zakatDay, today);
  const since = Math.abs(daysUntil(last, today));
  if (since > window) return null;
  const lastDay = last.toISOString().slice(0, 10);
  return my.history.some((h) => h.closed >= lastDay) ? null : since;
}

/** A date's Hijri day as a zakat day, the 30th kept to the 29th so every year has it. */
export function zakatDayOf(date: Date): ZakatDay {
  const h = gregorianToHijri(utcDay(date), CALENDAR);
  return { month: h.month, day: Math.min(29, h.day) };
}

/** The next zakat day after today: a year on if today is the day itself. */
export function comingZakatDay(zd: ZakatDay, today: Date): Date {
  const [first, second] = zakatDays(zd, today, 2);
  return daysUntil(first, today) === 0 ? second : first;
}

/** This year's zakat as plain text to send to family or an imam, by the visitor's choice. */
export function summaryText(s: {
  money: (n: number) => string;
  hijriYear: number;
  zakatDay: string | null;
  isDue: boolean;
  zakat: number;
  net: number;
  nisab: number;
  given: number;
  lines: { label: string; amount: number }[];
  debts: number;
  link: string;
}): string {
  const out = [`My zakat for ${s.hijriYear} AH`];
  if (s.zakatDay) out.push(`Zakat day: ${s.zakatDay}`);
  out.push(
    s.isDue
      ? `Zakat: ${s.money(s.zakat)} (2.5% of ${s.money(s.net)}, above the nisab of ${s.money(s.nisab)})`
      : `No zakat due: ${s.money(s.net)} is below the nisab of ${s.money(s.nisab)}`,
  );
  if (s.isDue) {
    const left = Math.max(0, s.zakat - s.given);
    out.push(`Given: ${s.money(s.given)} · ${left > 0.005 ? `Left: ${s.money(left)}` : "All given"}`);
  }
  out.push("", "What I counted:");
  for (const l of s.lines) out.push(`- ${l.label}: ${s.money(l.amount)}`);
  if (s.debts > 0) out.push(`- Debts due now: −${s.money(s.debts)}`);
  out.push("", `Worked out with Mizan: ${s.link}`);
  return out.join("\n");
}
