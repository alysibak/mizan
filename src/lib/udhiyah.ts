/**
 * Udhiyah / qurbani share math — cost split only.
 * Does not decide whether you are obligated, which animal qualifies, or local rules.
 */

export type UdhiyahAnimal = "sheep" | "goat" | "cow" | "camel";

/** Classical maximum shares per animal commonly taught for udhiyah. */
export function maxShares(animal: UdhiyahAnimal): number {
  if (animal === "cow" || animal === "camel") return 7;
  return 1;
}

export interface UdhiyahInput {
  animal: UdhiyahAnimal;
  /** Total price paid for the animal. */
  animalCost: number;
  /** How many shares you are taking (1..maxShares). */
  yourShares: number;
  /** Optional extra sadaqah or butchering fees you want included. */
  extras?: number;
}

export interface UdhiyahResult {
  maxShares: number;
  shareCost: number;
  yourCost: number;
  totalWithExtras: number;
  valid: boolean;
  message: string;
}

export function calculateUdhiyah(input: UdhiyahInput): UdhiyahResult {
  const max = maxShares(input.animal);
  const extras = Math.max(0, input.extras ?? 0);
  const cost = Math.max(0, input.animalCost);
  const shares = input.yourShares;

  if (!(cost > 0)) {
    return {
      maxShares: max,
      shareCost: 0,
      yourCost: 0,
      totalWithExtras: extras,
      valid: false,
      message: "Enter the animal’s total cost.",
    };
  }
  if (!Number.isInteger(shares) || shares < 1 || shares > max) {
    return {
      maxShares: max,
      shareCost: cost / max,
      yourCost: 0,
      totalWithExtras: extras,
      valid: false,
      message:
        max === 1
          ? "A sheep or goat is one share — enter 1."
          : `Enter a whole number of shares from 1 to ${max}.`,
    };
  }

  const shareCost = cost / max;
  const yourCost = shareCost * shares;
  return {
    maxShares: max,
    shareCost,
    yourCost,
    totalWithExtras: yourCost + extras,
    valid: true,
    message:
      max === 1
        ? "Full animal — one household share."
        : `${shares} of ${max} shares of this animal.`,
  };
}
