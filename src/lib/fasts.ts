/**
 * Fasts owed from past Ramadans, and what is paid instead when they cannot
 * be fasted: fidya for someone who will never be able to fast, kaffarah for
 * a fast broken on purpose, and kaffarah for a broken oath. Kept on the
 * phone like every other tool; My zakat counts what is left. Pure, so it is
 * tested.
 */
import { toCents } from "./money";

export const FASTS_KEY = "mizan-fasts-v1";

/** Days of fasting in a row for one fast broken on purpose. */
export const KAFFARAH_FAST_DAYS = 60;
/** People fed instead, only by someone truly unable to fast them. */
export const KAFFARAH_PEOPLE = 60;
/** People fed (or clothed) for one broken oath. */
export const OATH_PEOPLE = 10;
/** Days fasted for a broken oath by someone who cannot feed ten. */
export const OATH_FAST_DAYS = 3;
const MAX = 10_000;

export interface FastsState {
  /** Days to make up, as typed. */
  owed: string;
  /** Days made up so far, counted with a tap each. */
  madeUp: number;
  /** Days paid for with fidya, by someone who cannot fast at all. */
  fidyaDays: string;
  /** What feeding one person for a day costs where the visitor lives. */
  perDay: string;
  fidyaGiven: boolean;
  /** Ramadan fasts broken on purpose. */
  kaffarah: string;
  kaffarahDone: boolean;
  /** Oaths broken. */
  oaths: string;
  oathsDone: boolean;
}

export const EMPTY_FASTS: FastsState = {
  owed: "",
  madeUp: 0,
  fidyaDays: "",
  perDay: "",
  fidyaGiven: false,
  kaffarah: "",
  kaffarahDone: false,
  oaths: "",
  oathsDone: false,
};

export function parseFasts(raw: string | null): FastsState {
  if (!raw) return EMPTY_FASTS;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof FastsState, unknown>>;
    const text = (x: unknown) => (typeof x === "string" ? x.slice(0, 12) : "");
    const made = typeof v.madeUp === "number" && Number.isInteger(v.madeUp) ? Math.min(MAX, Math.max(0, v.madeUp)) : 0;
    return {
      owed: text(v.owed),
      madeUp: made,
      fidyaDays: text(v.fidyaDays),
      perDay: text(v.perDay),
      fidyaGiven: v.fidyaGiven === true,
      kaffarah: text(v.kaffarah),
      kaffarahDone: v.kaffarahDone === true,
      oaths: text(v.oaths),
      oathsDone: v.oathsDone === true,
    };
  } catch {
    return EMPTY_FASTS;
  }
}

/** A typed count of days or times: a whole number from 0, capped. */
export function count(raw: string): number {
  const n = Number(raw.trim());
  return Number.isInteger(n) && n > 0 ? Math.min(MAX, n) : 0;
}

export interface FastsOwed {
  /** Days still to make up. */
  left: number;
  /** Fidya for the days that will not be fasted. */
  fidya: number;
  /** Days to fast in a row, and the food instead for someone truly unable. */
  kaffarahDays: number;
  kaffarahFood: number;
  /** For broken oaths: feeding ten each, or three days' fasting each. */
  oathFood: number;
  oathDays: number;
  /** Money still to give, from whatever is not marked done. */
  toGive: number;
}

export function fastsOwed(s: FastsState, perDay: number): FastsOwed {
  const price = perDay > 0 && Number.isFinite(perDay) ? perDay : 0;
  const fidya = toCents(count(s.fidyaDays) * price);
  const kaffarahFood = toCents(count(s.kaffarah) * KAFFARAH_PEOPLE * price);
  const oathFood = toCents(count(s.oaths) * OATH_PEOPLE * price);
  return {
    left: Math.max(0, count(s.owed) - s.madeUp),
    fidya,
    kaffarahDays: count(s.kaffarah) * KAFFARAH_FAST_DAYS,
    kaffarahFood,
    oathFood,
    oathDays: count(s.oaths) * OATH_FAST_DAYS,
    toGive: toCents((s.fidyaGiven ? 0 : fidya) + (s.oathsDone ? 0 : oathFood)),
  };
}

/** Whether anything at all is kept, so My zakat can leave the tool out until it is used. */
export function fastsKept(s: FastsState): boolean {
  return count(s.owed) > 0 || count(s.fidyaDays) > 0 || count(s.kaffarah) > 0 || count(s.oaths) > 0;
}
