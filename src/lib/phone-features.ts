/**
 * Every tool that remembers something on the phone, in one list. A tool adds
 * one entry here and the rest follows: My zakat shows it with where it stands
 * and puts what it owes on the to-do list, the home page offers it to someone
 * coming back, and it is saved in a copy and moved to a new phone with
 * everything else. Words are English for now. Pure, so it is tested.
 */
import { parseAmount, type DecimalMark } from "./calculator";
import { FARM_KEY, farmDues, parseFarm } from "./farm";
import { FASTS_KEY, fastsKept, fastsOwed, parseFasts } from "./fasts";
import { DEBTS_KEY, debtTotals, parseDebts, repaymentsDue } from "./debts";
import { FITR_KEY, parseFitr, zakatAlFitr } from "./fitr";
import { INTEREST_KEY, parseInterest } from "./interest";
import { MISSED_KEY, missedZakat, parseTally, tallyAmounts } from "./missed";

export const FAMILY_KEY = "mizan-family-v1";

export interface PhoneContext {
  today: Date;
  /** Amounts in the visitor's currency. */
  money: (n: number) => string;
  /** How the visitor writes decimals, for the tallies typed in their own way. */
  decimal: DecimalMark;
  /** For numbers in words, such as kilograms. */
  intl: string;
}

/** One tool's line: what it is, where it stands, and where to carry on. */
export interface PhoneLine {
  key: string;
  /** A picture key from the page icons. */
  icon: string;
  title: string;
  status: string;
  href: string;
}

/** What the phone's tools say is still owed, for the to-do list. */
export interface PhoneDues {
  missedLeft: number;
  interestToGive: number;
  farmDue: boolean;
  /** Missed fasts still to make up, and fidya or oath food still to give. */
  fastsLeft: number;
  fastsToGive: number;
  /** Repayments you owe that are late or due within a week. */
  repaymentsDue: number;
}

interface PhoneFeature {
  key: string;
  storageKey: string;
  /** Its line, or null when nothing worth showing is kept. */
  line: (raw: string | null, ctx: PhoneContext) => PhoneLine | null;
  /** What it adds to the dues, if anything. */
  dues?: (raw: string | null, ctx: PhoneContext) => Partial<PhoneDues>;
}

function missedLeft(raw: string | null, ctx: PhoneContext) {
  const tally = parseTally(raw);
  const missed = missedZakat(tallyAmounts(tally, ctx.decimal), tally.months);
  return missed.valid ? Math.max(0, missed.total - parseAmount(tally.given, ctx.decimal)) : null;
}

const farmOwes = (raw: string | null) => farmDues(parseFarm(raw), (v) => parseAmount(v, "."));
const HERD_NAMES = { sheep: "sheep and goats", cattle: "cattle", camels: "camels" } as const;

export const PHONE_FEATURES: readonly PhoneFeature[] = [
  {
    key: "missed",
    storageKey: MISSED_KEY,
    line(raw, ctx) {
      const left = missedLeft(raw, ctx);
      if (left === null) return null;
      return {
        key: "missed",
        icon: "missed",
        title: "Past years",
        status: left > 0.005 ? `${ctx.money(left)} still to give` : "All paid off",
        href: "/missed-years",
      };
    },
    dues: (raw, ctx) => ({ missedLeft: missedLeft(raw, ctx) ?? 0 }),
  },
  {
    key: "farm",
    storageKey: FARM_KEY,
    line(raw, ctx) {
      const owes = farmOwes(raw);
      if (!(owes.cropKg > 0) && !owes.herds.length) return null;
      const parts = [
        owes.cropKg > 0 ? `${owes.cropKg.toLocaleString(ctx.intl)} kg of your harvest` : "",
        ...owes.herds.map((h) => h.dues.map((d) => `${d.count} from your ${HERD_NAMES[h.herd]}`).join(", ")),
      ].filter(Boolean);
      return { key: "farm", icon: "farm", title: "Crops and animals", status: `Give ${parts.join("; ")}`, href: "/farm" };
    },
    dues(raw) {
      const owes = farmOwes(raw);
      return { farmDue: owes.cropKg > 0 || owes.herds.length > 0 };
    },
  },
  {
    key: "interest",
    storageKey: INTEREST_KEY,
    line(raw, ctx) {
      const interest = parseInterest(raw);
      const amount = parseAmount(interest.interest, ".");
      if (!(amount > 0)) return null;
      return {
        key: "interest",
        icon: "interest",
        title: "Bank interest (not zakat)",
        status: `${ctx.money(amount)} ${interest.given ? "given away" : "to give away"}`,
        href: "/interest",
      };
    },
    dues(raw) {
      const interest = parseInterest(raw);
      return { interestToGive: interest.given ? 0 : parseAmount(interest.interest, ".") || 0 };
    },
  },
  {
    key: "family",
    storageKey: FAMILY_KEY,
    line(raw) {
      let count = 0;
      try {
        const members = raw ? (JSON.parse(raw) as { members?: unknown[] }).members : null;
        count = Array.isArray(members) ? members.length : 0;
      } catch {
        /* nothing readable kept */
      }
      return count > 1
        ? { key: "family", icon: "family", title: "Your family", status: `${count} people, each weighed on their own`, href: "/family" }
        : null;
    },
  },
  {
    key: "fitr",
    storageKey: FITR_KEY,
    line(raw, ctx) {
      const fitr = parseFitr(raw);
      const result = zakatAlFitr(parseInt(fitr.people, 10) || 0, parseFloat(fitr.perPerson) || 0);
      if (!(result.total > 0)) return null;
      return {
        key: "fitr",
        icon: "fitr",
        title: "Zakat al-Fitr",
        status: `${ctx.money(result.total)} for ${fitr.people} ${fitr.people === "1" ? "person" : "people"}, before the Eid prayer`,
        href: "/zakat-al-fitr",
      };
    },
  },
  {
    key: "fasts",
    storageKey: FASTS_KEY,
    line(raw, ctx) {
      const s = parseFasts(raw);
      if (!fastsKept(s)) return null;
      const owed = fastsOwed(s, parseAmount(s.perDay, "."));
      const parts = [
        owed.left > 0 ? `${owed.left} ${owed.left === 1 ? "fast" : "fasts"} to make up` : "",
        owed.toGive > 0.005 ? `${ctx.money(owed.toGive)} to give` : "",
        owed.kaffarahDays > 0 && !s.kaffarahDone ? `${owed.kaffarahDays} days of kaffarah` : "",
      ].filter(Boolean);
      return {
        key: "fasts",
        icon: "fasts",
        title: "Missed fasts",
        status: parts.length ? parts.join(" · ") : "All made up",
        href: "/fasts",
      };
    },
    dues(raw) {
      const s = parseFasts(raw);
      const owed = fastsOwed(s, parseAmount(s.perDay, "."));
      return { fastsLeft: owed.left, fastsToGive: owed.toGive };
    },
  },
  {
    key: "debts",
    storageKey: DEBTS_KEY,
    line(raw, ctx) {
      const notes = parseDebts(raw);
      if (!notes.length) return null;
      const t = debtTotals(notes);
      const parts = [
        t.owedToYou > 0 ? `${ctx.money(t.owedToYou)} owed to you` : "",
        t.youOwe > 0 ? `you owe ${ctx.money(t.youOwe)}` : "",
      ].filter(Boolean);
      return {
        key: "debts",
        icon: "debts",
        title: "Money lent and borrowed",
        status: parts.length ? parts.join(" · ") : "All paid back",
        href: "/debts",
      };
    },
    dues: (raw, ctx) => ({ repaymentsDue: repaymentsDue(parseDebts(raw), ctx.today) }),
  },
];

/** The storage keys of every tool above. */
export const PHONE_KEYS: readonly string[] = PHONE_FEATURES.map((f) => f.storageKey);

/** Each tool's line, in the list's order, leaving out those with nothing kept. */
export function phoneLines(read: (key: string) => string | null, ctx: PhoneContext): PhoneLine[] {
  return PHONE_FEATURES.map((f) => f.line(read(f.storageKey), ctx)).filter((l): l is PhoneLine => l !== null);
}

/** What the tools say is still owed. */
export function phoneDues(read: (key: string) => string | null, ctx: PhoneContext): PhoneDues {
  const dues: PhoneDues = {
    missedLeft: 0,
    interestToGive: 0,
    farmDue: false,
    fastsLeft: 0,
    fastsToGive: 0,
    repaymentsDue: 0,
  };
  for (const f of PHONE_FEATURES) Object.assign(dues, f.dues?.(read(f.storageKey), ctx));
  return dues;
}
