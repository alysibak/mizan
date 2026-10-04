// The zakat calculation engine.
//
// Pure functions, no I/O, no framework. Everything here is deterministic and
// unit-testable. This is the part of Mizan worth getting exactly right.
//
// Standard rate: 2.5 percent (one fortieth) of qualifying wealth held for one
// lunar year above nisab. When a user reckons on the solar (Gregorian) calendar
// instead of the lunar one, the rate is nudged up to account for the solar year
// being about eleven days longer than the lunar year:
//
//   2.5% * (365.25 / 354.367) ~= 2.577%
//
// so that wealth is not under-assessed over time.

import {
  type MetalPrices,
  type NisabStandard,
  nisabValue,
  goldNisabValue,
  silverNisabValue,
} from "./nisab";
import { sumCents, toCents } from "./money";

export const ZAKAT_RATE_LUNAR = 0.025;
// 2.5% scaled by the ratio of the solar to the lunar year length.
export const ZAKAT_RATE_SOLAR = 0.025 * (365.25 / 354.367); // ~= 0.025768

export type CalendarBasis = "lunar" | "solar";

export function zakatRate(basis: CalendarBasis): number {
  return basis === "solar" ? ZAKAT_RATE_SOLAR : ZAKAT_RATE_LUNAR;
}

export interface ZakatableAssetInput {
  category: string;
  label: string;
  amount: number;
  /** Fraction of value that is zakatable, 0..1. Defaults to 1. */
  zakatablePortion?: number;
}

export interface LiabilityInput {
  label: string;
  amount: number;
  deductible?: boolean; // defaults to true
}

export interface ZakatInput {
  assets: ZakatableAssetInput[];
  liabilities: LiabilityInput[];
  prices: MetalPrices;
  standard: NisabStandard;
  basis: CalendarBasis;
}

export interface AssetLine {
  category: string;
  label: string;
  amount: number;
  zakatablePortion: number;
  zakatableAmount: number;
}

export interface ZakatResult {
  /** Sum of (amount * zakatablePortion) across assets. */
  grossZakatable: number;
  /** Sum of deductible liabilities. */
  deductibleLiabilities: number;
  /** grossZakatable - deductibleLiabilities, floored at 0. */
  netZakatable: number;
  /** The applicable nisab value for the chosen standard. */
  nisab: number;
  goldNisab: number;
  silverNisab: number;
  standard: NisabStandard;
  basis: CalendarBasis;
  rate: number;
  /** True when net zakatable wealth meets or exceeds nisab. */
  isDue: boolean;
  /** netZakatable * rate when due, otherwise 0. */
  zakatDue: number;
  /** How far above (positive) or below (negative) nisab the wealth sits. */
  marginToNisab: number;
  lines: AssetLine[];
}

function clampPortion(p: number | undefined): number {
  if (p === undefined || Number.isNaN(p)) return 1;
  if (p < 0) return 0;
  if (p > 1) return 1;
  return p;
}

export function computeAssetLines(assets: ZakatableAssetInput[]): AssetLine[] {
  return assets.map((a) => {
    const portion = clampPortion(a.zakatablePortion);
    const amount = Math.max(0, a.amount || 0);
    return {
      category: a.category,
      label: a.label,
      amount,
      zakatablePortion: portion,
      zakatableAmount: amount * portion,
    };
  });
}

export function sumDeductibleLiabilities(liabilities: LiabilityInput[]): number {
  return sumCents(
    liabilities.filter((l) => l.deductible !== false).map((l) => Math.max(0, l.amount || 0)),
  );
}

export function calculateZakat(input: ZakatInput): ZakatResult {
  const lines = computeAssetLines(input.assets);
  // Totals are kept to the cent; only the zakat itself carries fractions
  // until it is rounded as an amount owed.
  const grossZakatable = sumCents(lines.map((l) => l.zakatableAmount));
  const deductibleLiabilities = sumDeductibleLiabilities(input.liabilities);
  const netZakatable = Math.max(0, toCents(grossZakatable - deductibleLiabilities));

  const nisab = nisabValue(input.standard, input.prices);
  const goldNisab = goldNisabValue(input.prices);
  const silverNisab = silverNisabValue(input.prices);

  const rate = zakatRate(input.basis);
  const isDue = netZakatable >= nisab && nisab > 0;
  const zakatDue = isDue ? netZakatable * rate : 0;

  return {
    grossZakatable,
    deductibleLiabilities,
    netZakatable,
    nisab,
    goldNisab,
    silverNisab,
    standard: input.standard,
    basis: input.basis,
    rate,
    isDue,
    zakatDue,
    marginToNisab: netZakatable - nisab,
    lines,
  };
}

// Purification of impermissible income.
//
// When a holding produces a small amount of non-permissible income (for example
// incidental interest inside an otherwise acceptable company), that portion is
// not lawful to keep and is given away separately from zakat. This is distinct
// from zakat and is not netted against it.
export function purificationAmount(
  income: number,
  impermissibleFraction: number,
): number {
  const frac = clampPortion(impermissibleFraction);
  return Math.max(0, income || 0) * frac;
}
