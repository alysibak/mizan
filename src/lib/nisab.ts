// Nisab: the minimum threshold of wealth at which zakat becomes due.
//
// Two prophetic standards exist, expressed in weights of precious metal:
//   gold:   85 grams  (20 mithqal / dinars)
//   silver: 595 grams (200 dirhams)
//
// The two are no longer equal in value. Many contemporary scholars recommend
// the silver standard because it is lower, so more people reach it and more is
// given to those in need. Others follow the gold standard. Mizan makes the
// choice explicit and shows both, rather than deciding for you.

export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;

export type NisabStandard = "gold" | "silver";

export interface MetalPrices {
  /** Price of one gram of gold in the user's currency. */
  goldPricePerGram: number;
  /** Price of one gram of silver in the user's currency. */
  silverPricePerGram: number;
}

export function goldNisabValue(prices: MetalPrices): number {
  return NISAB_GOLD_GRAMS * prices.goldPricePerGram;
}

export function silverNisabValue(prices: MetalPrices): number {
  return NISAB_SILVER_GRAMS * prices.silverPricePerGram;
}

export function nisabValue(standard: NisabStandard, prices: MetalPrices): number {
  return standard === "gold"
    ? goldNisabValue(prices)
    : silverNisabValue(prices);
}
