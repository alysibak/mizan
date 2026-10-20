"use client";

import { useMetalPrices } from "@/components/public/useMetalPrices";
import {
  CALC_STORAGE_KEY,
  computeDraft,
  draftIsEmpty,
  emptyDraft,
  parseDraft,
  type CalcDraft,
  type CalcOutcome,
} from "@/lib/calculator";
import { readStoredValue, setStoredValue, useStoredValue } from "@/lib/client-store";

export interface MyDraft {
  /** The figures, priced at today's metal prices unless the visitor typed their own. */
  draft: CalcDraft;
  outcome: CalcOutcome;
  /** Whether anything has been entered yet. */
  started: boolean;
  /** Change some figures; every page reading them follows. */
  update: (patch: Partial<CalcDraft>) => void;
}

/**
 * One person's own wealth, as one set of figures shared by the calculator,
 * the step-by-step guide, the shop page, the family page, and My zakat, so
 * nothing is entered twice or counted twice.
 */
export function useMyDraft(fallbackCurrency: string): MyDraft {
  const stored = parseDraft(useStoredValue(CALC_STORAGE_KEY));
  const base = stored ?? emptyDraft(fallbackCurrency, ".");
  const prices = useMetalPrices(base.currency);
  // Prices the visitor typed are theirs; otherwise today's are used.
  const typed = Boolean(base.goldPrice || base.silverPrice) && !base.pricesAsOf;
  const live = !typed && prices.gold !== null && prices.silver !== null;
  const draft: CalcDraft = live
    ? { ...base, goldPrice: String(prices.gold), silverPrice: String(prices.silver) }
    : base;

  function update(patch: Partial<CalcDraft>) {
    // Read afresh, so two quick edits do not overwrite each other.
    const current = parseDraft(readStoredValue(CALC_STORAGE_KEY)) ?? base;
    const next: CalcDraft = { ...current, ...patch };
    if (live) {
      next.goldPrice = String(prices.gold);
      next.silverPrice = String(prices.silver);
      next.pricesAsOf = new Date().toISOString();
    }
    setStoredValue(CALC_STORAGE_KEY, JSON.stringify(next));
  }

  return { draft, outcome: computeDraft(draft), started: Boolean(stored) && !draftIsEmpty(base), update };
}
