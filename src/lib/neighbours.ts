/**
 * Mizan Neighbours: needs near you, each checked by a mosque or community
 * group you can visit. A giver pledges, pays the mosque, and the mosque marks
 * it received and passes it on; the giver hears back that it arrived.
 *
 * Mizan never holds money and never stores who a family is: a need says what
 * is needed, never who needs it. These are the rules, pure so they are tested;
 * the database and the pages follow them.
 */
import { CODE_LENGTH, makeCode, readCode, showCode } from "./move";

export type NeighboursMode = "off" | "demo" | "on";

/**
 * Off unless the deployment turns it on. "demo" shows made-up needs from an
 * example mosque, to show partners how it works; "on" shows real partners.
 */
export function readNeighboursMode(raw: string | undefined): NeighboursMode {
  const v = raw?.trim().toLowerCase();
  return v === "on" || v === "demo" ? v : "off";
}

export const NEED_KINDS = [
  { key: "rent", label: "Rent", icon: "rent" },
  { key: "food", label: "Food", icon: "food" },
  { key: "medical", label: "Medicine or a hospital bill", icon: "medical" },
  { key: "bills", label: "Bills", icon: "bills" },
  { key: "debt", label: "A debt they cannot pay", icon: "debt" },
  { key: "school", label: "School costs", icon: "school" },
  { key: "travel", label: "Stranded far from home", icon: "travel" },
  { key: "other", label: "Something else", icon: "other" },
] as const;
export type NeedKind = (typeof NEED_KINDS)[number]["key"];

export function isNeedKind(v: unknown): v is NeedKind {
  return NEED_KINDS.some((k) => k.key === v);
}

export function kindLabel(kind: string): string {
  return NEED_KINDS.find((k) => k.key === kind)?.label ?? "Something else";
}

export const TITLE_MAX = 80;
export const STORY_MAX = 400;
export const THANKS_MAX = 200;
export const AMOUNT_MAX = 10_000_000;
/** How long a need is listed unless the mosque chooses otherwise. */
export const EXPIRY_DAYS = 30;
export const EXPIRY_CHOICES = [7, 14, 30, 60, 90] as const;
/** A pledge holds its place for this long, then lapses if nothing arrived. */
export const PLEDGE_HOLD_DAYS = 7;
/** Open reports that take a need off the list until the mosque looks. */
export const REPORTS_TO_PAUSE = 3;
/** A giver's name and contact are kept this long after a pledge is settled. */
export const CONTACT_KEEP_DAYS = 60;

export const REPORT_REASONS = [
  { key: "not-real", label: "I don’t think this is real" },
  { key: "identifies", label: "It could show who the family is" },
  { key: "wrong", label: "Something in it is wrong" },
  { key: "other", label: "Something else" },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]["key"];

export function isReportReason(v: unknown): v is ReportReason {
  return REPORT_REASONS.some((r) => r.key === v);
}

const DAY_MS = 86_400_000;

/**
 * What would point to a person: a phone number, an email, a link or a social
 * handle. Names and streets cannot be caught by a rule, so the form asks for
 * neither; this catches the slips a rule can.
 */
export function privacyProblem(text: string): string | null {
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text)) return "Take out the email address.";
  if (/(https?:\/\/|www\.)\S+/i.test(text)) return "Take out the link.";
  if (/(^|\s)@\w{2,}/.test(text)) return "Take out the social media name.";
  // Seven or more digits in a row, allowing spaces, dashes and brackets
  // between them: a phone number, an ID or an account number. Amounts
  // ("1,250,000", "1.250.000") and dates ("2026-10-23", "23/10/2026") are not.
  // Amounts with spaces are refused too: they cannot be told from a phone.
  const plain = text
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, "")
    .replace(/\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b/g, "")
    .replace(/\d{1,3}([,.]\d{3})+([.,]\d{1,2})?(?!\d)/g, "");
  if (/(\+?\d[\s\-().]*){7,}/.test(plain)) {
    return "Take out the phone, ID or account number.";
  }
  return null;
}

/** Plain text, one line or a few, tidied and kept short. */
export function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

/** Money as entered: positive, whole cents, not absurd. Null otherwise. */
export function readMoney(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[,\s]/g, "")) : NaN;
  if (!Number.isFinite(n) || n <= 0 || n > AMOUNT_MAX) return null;
  return Math.round(n * 100) / 100;
}

export interface NeedInput {
  kind: NeedKind;
  title: string;
  story: string;
  amount: number;
  zakat: boolean;
  days: number;
}

/** A need as a mosque writes it, checked; or what to fix. */
export function readNeed(body: unknown): { need: NeedInput } | { error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (!isNeedKind(b.kind)) return { error: "Choose what the need is for." };
  const title = cleanText(b.title, TITLE_MAX).replace(/\n/g, " ");
  if (title.length < 4) return { error: "Say in a few words what is needed." };
  const story = cleanText(b.story, STORY_MAX);
  const problem = privacyProblem(`${title}\n${story}`);
  if (problem) return { error: `${problem} Nothing should point to the family.` };
  const amount = readMoney(b.amount);
  if (amount === null) return { error: "Enter how much is needed." };
  if (typeof b.zakat !== "boolean") return { error: "Say whether zakat can go to this need." };
  const days = EXPIRY_CHOICES.includes(Number(b.days) as (typeof EXPIRY_CHOICES)[number])
    ? Number(b.days)
    : EXPIRY_DAYS;
  return { need: { kind: b.kind, title, story, amount, zakat: b.zakat, days } };
}

export interface PledgeInput {
  needId: string;
  amount: number;
  name: string;
  contact: string;
}

export function readPledge(body: unknown): { pledge: PledgeInput } | { error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (typeof b.needId !== "string" || !/^[0-9a-f-]{36}$/.test(b.needId)) return { error: "That need was not found." };
  const amount = readMoney(b.amount);
  if (amount === null) return { error: "Enter how much you will give." };
  return {
    pledge: {
      needId: b.needId,
      amount,
      name: cleanText(b.name, 40).replace(/\n/g, " "),
      contact: cleanText(b.contact, 80).replace(/\n/g, " "),
    },
  };
}

/** A pledge's code, as given to the giver to put on their transfer. */
export const pledgeCode = makeCode;
export const readPledgeCode = readCode;
export const showPledgeCode = showCode;
export const PLEDGE_CODE_LENGTH = CODE_LENGTH;

export interface PledgeLike {
  amount: number;
  status: string;
  createdAt: string;
}

/** SQLite's CURRENT_TIMESTAMP ("2026-10-23 14:00:00") or an ISO time, as a Date. */
export function readTime(stamp: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(stamp) ? stamp : `${stamp.replace(" ", "T")}Z`);
}

/** A time as SQLite's CURRENT_TIMESTAMP writes it, so the two compare. */
export function sqlTime(at: Date): string {
  return at.toISOString().replace("T", " ").slice(0, 19);
}

/** A pledge still holding its place: made, nothing arrived yet, not too old. */
export function pledgeHolds(p: PledgeLike, now: Date): boolean {
  return p.status === "pledged" && now.getTime() - readTime(p.createdAt).getTime() < PLEDGE_HOLD_DAYS * DAY_MS;
}

export interface NeedLike {
  amount: number;
  received: number;
  status: string;
  paused: boolean;
  expiresAt: string | null;
}

export interface NeedProgress {
  received: number;
  /** Promised and still holding its place. */
  pledged: number;
  /** What can still be pledged: never more than is needed. */
  room: number;
  /** 0..1 received, and 0..1 received or promised, for the bar. */
  share: number;
  promisedShare: number;
}

const cents = (n: number) => Math.round(n * 100) / 100;

export function needProgress(need: Pick<NeedLike, "amount" | "received">, pledges: PledgeLike[], now: Date): NeedProgress {
  const pledged = cents(pledges.filter((p) => pledgeHolds(p, now)).reduce((s, p) => s + p.amount, 0));
  const received = cents(need.received);
  const room = Math.max(0, cents(need.amount - received - pledged));
  const of = (n: number) => (need.amount > 0 ? Math.min(1, n / need.amount) : 0);
  return { received, pledged, room, share: of(received), promisedShare: of(received + pledged) };
}

export type NeedState =
  | "draft" // written, not yet listed
  | "open" // listed, room to give
  | "covered" // fully promised, waiting for the money
  | "met" // all of it arrived
  | "ended" // its time ran out
  | "paused" // taken off the list for a check
  | "closed"
  | "removed";

/** Where a need stands, for the mosque's list and for whether it is shown. */
export function needState(need: NeedLike, progress: NeedProgress, now: Date): NeedState {
  if (need.status === "removed") return "removed";
  if (need.status === "closed") return progress.received >= need.amount ? "met" : "closed";
  if (need.status === "draft") return "draft";
  if (progress.received >= need.amount) return "met";
  if (need.paused) return "paused";
  if (need.expiresAt && readTime(need.expiresAt).getTime() <= now.getTime()) return "ended";
  return progress.room > 0 ? "open" : "covered";
}

/** Listed for givers: open, or fully promised so they can see it is in hand. */
export function isListed(state: NeedState): boolean {
  return state === "open" || state === "covered";
}

/** Whole days left, at least 1 while any time remains. */
export function daysLeft(expiresAt: string | null, now: Date): number | null {
  if (!expiresAt) return null;
  const ms = readTime(expiresAt).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.max(1, Math.ceil(ms / DAY_MS));
}

export function expiryFrom(now: Date, days: number): string {
  return sqlTime(new Date(now.getTime() + days * DAY_MS));
}

/**
 * Whether this person may list a need. With the two-person check on, a need
 * written by one member is listed by another, so no one can list a need alone.
 */
export function canPublish(opts: {
  twoPerson: boolean;
  members: number;
  createdBy: string | null;
  userId: string;
}): { ok: true } | { ok: false; why: string } {
  if (!opts.twoPerson) return { ok: true };
  if (opts.members < 2) {
    return { ok: false, why: "A second person must check each need. Add one in Settings, or turn the check off." };
  }
  if (opts.createdBy === opts.userId) {
    return { ok: false, why: "Someone other than the person who wrote it must check and list it." };
  }
  return { ok: true };
}

/** A short web address for a mosque, from its name. */
export function slugFor(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "mosque"
  );
}
