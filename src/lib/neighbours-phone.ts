/**
 * The promises made on this phone, so a giver can find their code again and
 * see that it arrived. Only what they need for that: no name, no contact.
 * Pure, so it is tested.
 */
export const PLEDGES_KEY = "mizan-pledges-v1";
const MAX_KEPT = 50;

export interface KeptPledge {
  code: string;
  needId: string;
  title: string;
  partner: string;
  amount: number;
  currency: string;
  /** Zakat may go to this need, so once it arrives it can count as zakat given. */
  zakat: boolean;
  /** YYYY-MM-DD it was made. */
  day: string;
  /** Already noted in My zakat, so it is not noted twice. */
  noted: boolean;
}

const CODE = /^[2-9A-HJ-NP-Z]{8}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function text(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function parsePledges(raw: string | null): KeptPledge[] {
  if (!raw) return [];
  let list: unknown;
  try {
    list = (JSON.parse(raw) as { pledges?: unknown }).pledges;
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  return list
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === "object")
    .filter((p) => typeof p.code === "string" && CODE.test(p.code))
    .map((p) => ({
      code: p.code as string,
      needId: text(p.needId, 36),
      title: text(p.title, 80),
      partner: text(p.partner, 80),
      amount: typeof p.amount === "number" && Number.isFinite(p.amount) && p.amount > 0 ? p.amount : 0,
      currency: /^[A-Z]{3}$/.test(text(p.currency, 3)) ? text(p.currency, 3) : "USD",
      zakat: p.zakat === true,
      day: DAY.test(text(p.day, 10)) ? text(p.day, 10) : "",
      noted: p.noted === true,
    }))
    .slice(-MAX_KEPT);
}

export function writePledges(list: KeptPledge[]): string {
  return JSON.stringify({ pledges: list.slice(-MAX_KEPT) });
}

/** A new promise added, or the same code replaced. */
export function keepPledge(list: KeptPledge[], p: KeptPledge): KeptPledge[] {
  return [...list.filter((k) => k.code !== p.code), p].slice(-MAX_KEPT);
}

export function markNoted(list: KeptPledge[], code: string): KeptPledge[] {
  return list.map((k) => (k.code === code ? { ...k, noted: true } : k));
}

export function forgetPledge(list: KeptPledge[], code: string): KeptPledge[] {
  return list.filter((k) => k.code !== code);
}
