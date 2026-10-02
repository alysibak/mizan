import {
  isWeighable,
  metalFor,
  pricePerGram,
  valueByWeight,
  type Metal,
} from "./metals";

export interface AssetWeightFields {
  category: string;
  amount: number;
  grams?: number | null;
  purity?: number | null;
  metal?: string | null;
}

export interface NormalizedWeight {
  amount: number;
  grams: number | null;
  purity: number | null;
  metal: Metal | null;
}

/**
 * Settle the value of a holding before it is stored. A gold, silver, or
 * jewellery holding entered by weight is valued from the current settings
 * price, so the server (not the browser) decides the figure. Weight fields on
 * any other category are dropped.
 */
export function normalizeWeight(
  input: AssetWeightFields,
  prices: { goldPricePerGram: number; silverPricePerGram: number },
): NormalizedWeight {
  const grams = input.grams ?? null;
  if (!isWeighable(input.category) || !grams || !(grams > 0)) {
    return { amount: input.amount, grams: null, purity: null, metal: null };
  }
  const metal = metalFor(input.category, input.metal)!;
  const purity = input.purity && input.purity > 0 ? Math.min(1, input.purity) : 1;
  return {
    amount: valueByWeight(grams, purity, pricePerGram(metal, prices)),
    grams,
    purity,
    metal,
  };
}
