import { zakatRate, type CalendarBasis } from "./zakat";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "./nisab";

/**
 * Reverse the usual question: “If I want to give this much zakat,
 * how much net zakatable wealth does that imply (at the chosen rate)?”
 */
export function impliedWealthFromZakat(
  zakatAmount: number,
  basis: CalendarBasis = "lunar",
): number {
  if (!(zakatAmount > 0)) return 0;
  const rate = zakatRate(basis);
  return zakatAmount / rate;
}

/**
 * Split a zakat total across asnaf “envelopes.”
 * Amounts are rounded to cents; remainder goes to the first non-zero share.
 */
export function allocateEnvelopes(
  total: number,
  weights: Record<string, number>,
): { key: string; amount: number }[] {
  if (!(total > 0)) return [];
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const weightSum = entries.reduce((s, [, w]) => s + w, 0);
  if (weightSum <= 0) return [];

  const raw = entries.map(([key, w]) => ({
    key,
    amount: (total * w) / weightSum,
  }));

  // Floor to cents, then distribute leftover cents.
  const floored = raw.map((r) => ({
    key: r.key,
    amount: Math.floor(r.amount * 100) / 100,
  }));
  const allocated = floored.reduce((s, r) => s + r.amount, 0);
  let leftover = Math.round((total - allocated) * 100) / 100;
  let i = 0;
  while (leftover >= 0.01 && i < floored.length * 2) {
    floored[i % floored.length].amount =
      Math.round((floored[i % floored.length].amount + 0.01) * 100) / 100;
    leftover = Math.round((leftover - 0.01) * 100) / 100;
    i++;
  }
  return floored.filter((r) => r.amount > 0);
}

export interface WhatIfNisab {
  goldNisab: number;
  silverNisab: number;
  chosenNisab: number;
  netZakatable: number;
  meetsNisab: boolean;
  margin: number;
  zakatIfDue: number;
}

/** Recompute nisab line when metal prices move — wealth held constant. */
export function whatIfNisab(opts: {
  netZakatable: number;
  goldPricePerGram: number;
  silverPricePerGram: number;
  standard: "gold" | "silver";
  basis: CalendarBasis;
}): WhatIfNisab {
  const goldNisab = NISAB_GOLD_GRAMS * opts.goldPricePerGram;
  const silverNisab = NISAB_SILVER_GRAMS * opts.silverPricePerGram;
  const chosenNisab = opts.standard === "gold" ? goldNisab : silverNisab;
  // Same rule as calculateZakat: a zero nisab (no price) never makes zakat due.
  const meetsNisab = chosenNisab > 0 && opts.netZakatable >= chosenNisab;
  const rate = zakatRate(opts.basis);
  return {
    goldNisab,
    silverNisab,
    chosenNisab,
    netZakatable: opts.netZakatable,
    meetsNisab,
    margin: opts.netZakatable - chosenNisab,
    zakatIfDue: meetsNisab ? opts.netZakatable * rate : 0,
  };
}
