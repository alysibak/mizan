export const TROY_OUNCE_GRAMS = 31.1034768;

/** Convert a USD-per-troy-ounce metal price into per-gram in another currency. */
export function perGramFromPerOunce(
  usdPerOunce: number,
  usdToLocal = 1,
): number {
  if (!usdPerOunce || usdPerOunce <= 0) return 0;
  return (usdPerOunce / TROY_OUNCE_GRAMS) * usdToLocal;
}
