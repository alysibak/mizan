import {
  isWeighable,
  metalFor,
  pricePerGram,
  valueByWeight,
  type Metal,
} from "./metals";
import { toCents } from "./money";

export interface AssetValueFields {
  category: string;
  amount: number;
  grams?: number | null;
  purity?: number | null;
  metal?: string | null;
  foreignCurrency?: string | null;
  foreignAmount?: number | null;
  fxRate?: number | null;
}

export interface NormalizedValue {
  amount: number;
  grams: number | null;
  purity: number | null;
  metal: Metal | null;
  foreignCurrency: string | null;
  foreignAmount: number | null;
  fxRate: number | null;
}

type Prices = { goldPricePerGram: number; silverPricePerGram: number };

const NO_WEIGHT = { grams: null, purity: null, metal: null } as const;
const NO_FOREIGN = { foreignCurrency: null, foreignAmount: null, fxRate: null } as const;

/**
 * Settle the value of a holding before it is stored, so the server (not the
 * browser) decides the figure:
 * - gold, silver, or jewellery entered by weight is priced from settings;
 * - a holding in another currency is converted at the user's own rate;
 * - otherwise the amount stands, and stray weight or currency fields drop.
 */
export function normalizeAsset(
  input: AssetValueFields,
  prices: Prices,
  baseCurrency: string,
): NormalizedValue {
  const grams = input.grams ?? null;
  if (isWeighable(input.category) && grams && grams > 0) {
    const metal = metalFor(input.category, input.metal)!;
    const purity = input.purity && input.purity > 0 ? Math.min(1, input.purity) : 1;
    return {
      amount: valueByWeight(grams, purity, pricePerGram(metal, prices)),
      grams,
      purity,
      metal,
      ...NO_FOREIGN,
    };
  }

  const currency = input.foreignCurrency?.toUpperCase() ?? null;
  const foreignAmount = input.foreignAmount ?? null;
  const rate = input.fxRate ?? null;
  if (
    currency &&
    currency !== baseCurrency.toUpperCase() &&
    foreignAmount !== null &&
    foreignAmount >= 0 &&
    rate &&
    rate > 0
  ) {
    return {
      amount: toCents(foreignAmount * rate),
      ...NO_WEIGHT,
      foreignCurrency: currency,
      foreignAmount,
      fxRate: rate,
    };
  }

  return { amount: input.amount, ...NO_WEIGHT, ...NO_FOREIGN };
}
