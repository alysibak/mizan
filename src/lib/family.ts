/**
 * Zakat is owed by each person on what is theirs: a wife's jewellery is
 * hers, a son's savings are his. A family that adds everything together can
 * pay when no one owes, or miss the one person who does. This works out
 * each person on their own, against the same nisab.
 */
import { ZAKAT_RATE_LUNAR } from "@/lib/zakat";

export interface Holdings {
  /** Cash, bank, and savings. */
  cash: number;
  /** Gold of any kind, by weight in grams. */
  goldGrams: number;
  /** Fineness of that gold, 0.916 for 22k. */
  goldPurity: number;
  /** Debts due now, taken off their own wealth only. */
  debts: number;
}

export interface PersonResult {
  /** What they own before debts. */
  owns: number;
  /** After their own debts, never below zero. */
  net: number;
  due: boolean;
  zakat: number;
}

export function personZakat(h: Holdings, goldPerGram: number, nisab: number): PersonResult {
  const n = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);
  const owns = n(h.cash) + n(h.goldGrams) * n(h.goldPurity) * n(goldPerGram);
  const net = Math.max(0, owns - n(h.debts));
  const due = nisab > 0 && net >= nisab;
  return { owns, net, due, zakat: due ? Math.round(net * ZAKAT_RATE_LUNAR * 100) / 100 : 0 };
}

export interface FamilyResult {
  people: PersonResult[];
  /** Everyone's zakat added up. */
  total: number;
  /** Everyone's wealth added together, as a family that pools would count it. */
  pooled: number;
  /**
   * Adding everyone together would give a different answer: the pooled
   * wealth is over the nisab, yet someone with wealth is under it alone.
   */
  poolingMisleads: boolean;
}

/**
 * A person whose wealth was worked out elsewhere (the visitor's own figures
 * in the calculator), weighed against the family page's nisab.
 */
export function personFromNet(owns: number, net: number, nisab: number): PersonResult {
  const n = Number.isFinite(net) && net > 0 ? net : 0;
  const due = nisab > 0 && n >= nisab;
  return { owns: Math.max(0, owns), net: n, due, zakat: due ? Math.round(n * ZAKAT_RATE_LUNAR * 100) / 100 : 0 };
}

export function familyZakat(all: Holdings[], goldPerGram: number, nisab: number): FamilyResult {
  return familyOf(
    all.map((h) => personZakat(h, goldPerGram, nisab)),
    nisab,
  );
}

/** The family's totals from each person's own result. */
export function familyOf(people: PersonResult[], nisab: number): FamilyResult {
  const total = Math.round(people.reduce((sum, p) => sum + p.zakat, 0) * 100) / 100;
  const pooled = people.reduce((sum, p) => sum + p.net, 0);
  const poolingMisleads = nisab > 0 && pooled >= nisab && people.some((p) => p.net > 0 && !p.due);
  return { people, total, pooled, poolingMisleads };
}
