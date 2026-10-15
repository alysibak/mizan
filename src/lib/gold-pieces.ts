/**
 * Typical weights of gold pieces, for people who do not know what their
 * jewellery weighs. Rough by design: real pieces vary a great deal, so the
 * total is shown as an estimate with a nudge to have them weighed.
 */

import { TOLA_GRAMS } from "./metals";

export const GOLD_PIECES = [
  { key: "ring", grams: 4 },
  { key: "earrings", grams: 5 },
  { key: "nosePin", grams: 1 },
  { key: "chain", grams: 10 },
  { key: "bracelet", grams: 10 },
  { key: "bangle", grams: 12 },
  { key: "necklace", grams: 25 },
  { key: "coin", grams: 8 },
] as const;

export type GoldPieceKey = (typeof GOLD_PIECES)[number]["key"];

export const MAX_PIECES = 99;

/** Total grams for a count of each piece. */
export function piecesGrams(counts: Partial<Record<GoldPieceKey, number>>): number {
  return GOLD_PIECES.reduce((sum, p) => {
    const n = Math.max(0, Math.min(MAX_PIECES, Math.floor(counts[p.key] ?? 0)));
    return sum + n * p.grams;
  }, 0);
}

/** A weight in grams written in the unit someone is typing in, to two places. */
export function inUnit(grams: number, unit: "g" | "tola"): string {
  const value = unit === "tola" ? grams / TOLA_GRAMS : grams;
  return String(Math.round(value * 100) / 100);
}
