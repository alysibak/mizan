/**
 * Money lent and borrowed, written down as the Quran asks (2:282): a private
 * note kept on the phone, never sent anywhere. What others owe you counts
 * for zakat; what you owe can be taken off it. Pure, so it is tested.
 */
import { parseAmount } from "./calculator";
import { toCents } from "./money";

export const DEBTS_KEY = "mizan-debts-v1";

/** "lent": they owe you. "borrowed": you owe them. */
export type DebtKind = "lent" | "borrowed";
export type DebtStatus = "open" | "paid" | "forgiven";

export interface DebtNote {
  id: string;
  kind: DebtKind;
  /** A name or nickname, or "" for someone left unnamed. */
  who: string;
  /** As typed, with "." for decimals. */
  amount: string;
  /** Paid back so far, as typed. */
  paid: string;
  /** YYYY-MM-DD to be paid back by, or "". */
  due: string;
  /** YYYY-MM-DD it was written down. */
  made: string;
  status: DebtStatus;
}

const MAX_NOTES = 200;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDebts(raw: string | null): DebtNote[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as { notes?: unknown };
    if (!Array.isArray(data.notes)) return [];
    const text = (x: unknown, max: number) => (typeof x === "string" ? x.slice(0, max) : "");
    return data.notes
      .filter((n): n is Record<string, unknown> => Boolean(n) && typeof n === "object")
      .map((n): DebtNote => ({
        id: text(n.id, 40),
        kind: n.kind === "borrowed" ? ("borrowed" as const) : ("lent" as const),
        who: text(n.who, 60),
        amount: text(n.amount, 40),
        paid: text(n.paid, 40),
        due: DAY.test(text(n.due, 10)) ? text(n.due, 10) : "",
        made: DAY.test(text(n.made, 10)) ? text(n.made, 10) : "",
        status: (n.status === "paid" || n.status === "forgiven" ? n.status : "open") as DebtStatus,
      }))
      .filter((n) => n.id && parseAmount(n.amount, ".") > 0)
      .slice(0, MAX_NOTES);
  } catch {
    return [];
  }
}

export function serializeDebts(notes: DebtNote[]): string {
  return JSON.stringify({ notes: notes.slice(0, MAX_NOTES) });
}

/** What is still to be paid back on a note: nothing once it is settled. */
export function leftOn(note: DebtNote): number {
  if (note.status !== "open") return 0;
  return Math.max(0, toCents(parseAmount(note.amount, ".") - parseAmount(note.paid, ".")));
}

export interface DebtTotals {
  /** Still owed to you, and on how many notes. */
  owedToYou: number;
  owedToYouCount: number;
  /** Still owed by you, and on how many notes. */
  youOwe: number;
  youOweCount: number;
}

export function debtTotals(notes: DebtNote[]): DebtTotals {
  const t: DebtTotals = { owedToYou: 0, owedToYouCount: 0, youOwe: 0, youOweCount: 0 };
  for (const n of notes) {
    const left = leftOn(n);
    if (left <= 0) continue;
    if (n.kind === "lent") {
      t.owedToYou = toCents(t.owedToYou + left);
      t.owedToYouCount += 1;
    } else {
      t.youOwe = toCents(t.youOwe + left);
      t.youOweCount += 1;
    }
  }
  return t;
}

/** Whole days from `today` to a YYYY-MM-DD day: negative once it has passed. */
function daysTo(day: string, today: Date): number {
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.parse(`${day}T00:00:00Z`) - start) / 86_400_000);
}

/** "late" once the day has passed, "soon" within a week, otherwise null. */
export function dueState(note: DebtNote, today: Date): "late" | "soon" | null {
  if (!note.due || leftOn(note) <= 0) return null;
  const days = daysTo(note.due, today);
  if (days < 0) return "late";
  if (days <= 7) return "soon";
  return null;
}

/** Repayments you owe that are late or due within a week. */
export function repaymentsDue(notes: DebtNote[], today: Date): number {
  return notes.filter((n) => n.kind === "borrowed" && dueState(n, today) !== null).length;
}

/** A new note, open, written down today. */
export function newNote(
  fields: { kind: DebtKind; who: string; amount: string; due: string },
  today: Date,
  id: string,
): DebtNote {
  return {
    id,
    kind: fields.kind,
    who: fields.who.trim().slice(0, 60),
    amount: fields.amount,
    paid: "",
    due: DAY.test(fields.due) ? fields.due : "",
    made: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0, 10),
    status: "open",
  };
}

/** A part paid back; the note is settled once nothing is left. */
export function payPart(note: DebtNote, amount: number): DebtNote {
  const paid = toCents(parseAmount(note.paid, ".") + Math.max(0, amount));
  const settled = paid >= parseAmount(note.amount, ".") - 0.005;
  return { ...note, paid: String(paid), status: settled ? "paid" : note.status };
}

/**
 * The note as words both people can read, to send to the other person.
 * Written so that it reads the same whoever sends it.
 */
export function noteText(note: DebtNote, money: (n: number) => string): string {
  const amount = money(parseAmount(note.amount, "."));
  const other = note.who || "someone";
  const head =
    note.kind === "lent"
      ? `I lent ${other} ${amount} on ${note.made}.`
      : `I borrowed ${amount} from ${other} on ${note.made}.`;
  const by = note.due ? ` To be paid back by ${note.due}.` : "";
  const paid = parseAmount(note.paid, ".");
  const sofar = paid > 0 ? ` Paid back so far: ${money(paid)}.` : "";
  return `${head}${by}${sofar} Written down so neither of us forgets (Quran 2:282).`;
}
