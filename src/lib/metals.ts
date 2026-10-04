import { toCents } from "./money";

export const TROY_OUNCE_GRAMS = 31.1034768;

/** Convert a USD-per-troy-ounce metal price into per-gram in another currency. */
export function perGramFromPerOunce(
  usdPerOunce: number,
  usdToLocal = 1,
): number {
  if (!usdPerOunce || usdPerOunce <= 0) return 0;
  return (usdPerOunce / TROY_OUNCE_GRAMS) * usdToLocal;
}

export type Metal = "gold" | "silver";

/** Categories whose value can be entered by weight. */
export const WEIGHABLE_CATEGORIES = ["gold", "silver", "jewellery"] as const;

export function isWeighable(category: string): boolean {
  return (WEIGHABLE_CATEGORIES as readonly string[]).includes(category);
}

/**
 * The metal a weighed holding is priced against. Gold and silver holdings are
 * their own metal; jewellery can be either, chosen by the user (gold if unset).
 */
export function metalFor(category: string, chosen?: string | null): Metal | null {
  if (category === "gold" || category === "silver") return category;
  if (category === "jewellery") return chosen === "silver" ? "silver" : "gold";
  return null;
}

export function pricePerGram(
  metal: Metal,
  prices: { goldPricePerGram: number; silverPricePerGram: number },
): number {
  return metal === "silver" ? prices.silverPricePerGram : prices.goldPricePerGram;
}

/** Market value of a weighed holding, to the cent. Purity is fineness 0..1. */
export function valueByWeight(grams: number, purity: number, perGram: number): number {
  if (!(grams > 0) || !(purity > 0) || !(perGram > 0)) return 0;
  return toCents(grams * Math.min(1, purity) * perGram);
}

/** Common karat stamps as fineness, for quick picking. */
export const KARAT_PURITY: { label: string; purity: number }[] = [
  { label: "24k (999)", purity: 0.999 },
  { label: "22k (916)", purity: 0.916 },
  { label: "21k (875)", purity: 0.875 },
  { label: "18k (750)", purity: 0.75 },
  { label: "14k (585)", purity: 0.585 },
  { label: "Sterling (925)", purity: 0.925 },
];
