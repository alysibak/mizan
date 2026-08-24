// Shariah equity screening (AAOIFI-style).
//
// Two gates decide whether a stock is permissible to hold:
//   1. Business activity: the company's core business must be halal.
//   2. Financial ratios: leverage and interest exposure must stay within limits.
//
// Inputs are entered by hand (or pasted from a free source), so this module
// never depends on a paid financial-data API. The thresholds below follow the
// commonly cited AAOIFI standard. Index providers (Dow Jones Islamic, S&P
// Shariah, MSCI Islamic) use slightly different denominators and cutoffs, so
// the denominator basis is configurable.

export type DenominatorBasis = "marketCap" | "totalAssets";

export interface BusinessActivity {
  alcohol: boolean;
  gambling: boolean;
  conventionalFinance: boolean; // interest-based banking, insurance, lending
  porkAndNonHalalFood: boolean;
  adultEntertainment: boolean;
  tobacco: boolean;
  weapons: boolean;
}

export interface FinancialFigures {
  marketCap: number;
  totalAssets: number;
  interestBearingDebt: number;
  cashAndInterestSecurities: number;
  totalRevenue: number;
  impermissibleRevenue: number; // e.g. incidental interest income
}

export interface ScreeningOptions {
  denominator: DenominatorBasis; // basis for the debt and cash ratios
}

export const THRESHOLDS = {
  debtRatio: 0.3, // interest-bearing debt / denominator
  cashRatio: 0.3, // cash + interest securities / denominator
  impermissibleRevenueRatio: 0.05, // non-permissible income / total revenue
} as const;

export interface RatioCheck {
  label: string;
  value: number; // the computed ratio (0..1+)
  threshold: number;
  pass: boolean;
}

export interface ScreeningResult {
  businessPass: boolean;
  failingActivities: string[];
  ratios: RatioCheck[];
  ratiosPass: boolean;
  /** Overall compliance: both gates must pass. */
  compliant: boolean;
  /** Fraction of income to purify if held, based on impermissible revenue. */
  purificationRatio: number;
}

const ACTIVITY_LABELS: Record<keyof BusinessActivity, string> = {
  alcohol: "Alcohol",
  gambling: "Gambling",
  conventionalFinance: "Conventional finance (interest)",
  porkAndNonHalalFood: "Pork / non-halal food",
  adultEntertainment: "Adult entertainment",
  tobacco: "Tobacco",
  weapons: "Weapons",
};

function ratio(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return Infinity;
  return numerator / denominator;
}

export function screenEquity(
  activity: BusinessActivity,
  figures: FinancialFigures,
  options: ScreeningOptions = { denominator: "marketCap" },
): ScreeningResult {
  const failingActivities = (
    Object.keys(activity) as (keyof BusinessActivity)[]
  )
    .filter((k) => activity[k])
    .map((k) => ACTIVITY_LABELS[k]);
  const businessPass = failingActivities.length === 0;

  const denom =
    options.denominator === "totalAssets"
      ? figures.totalAssets
      : figures.marketCap;

  const debt = ratio(figures.interestBearingDebt, denom);
  const cash = ratio(figures.cashAndInterestSecurities, denom);
  const impermissible = ratio(figures.impermissibleRevenue, figures.totalRevenue);

  const ratios: RatioCheck[] = [
    {
      label: `Interest-bearing debt / ${options.denominator === "totalAssets" ? "total assets" : "market cap"}`,
      value: debt,
      threshold: THRESHOLDS.debtRatio,
      pass: debt < THRESHOLDS.debtRatio,
    },
    {
      label: `Cash + interest securities / ${options.denominator === "totalAssets" ? "total assets" : "market cap"}`,
      value: cash,
      threshold: THRESHOLDS.cashRatio,
      pass: cash < THRESHOLDS.cashRatio,
    },
    {
      label: "Impermissible revenue / total revenue",
      value: impermissible,
      threshold: THRESHOLDS.impermissibleRevenueRatio,
      pass: impermissible < THRESHOLDS.impermissibleRevenueRatio,
    },
  ];

  const ratiosPass = ratios.every((r) => r.pass);

  return {
    businessPass,
    failingActivities,
    ratios,
    ratiosPass,
    compliant: businessPass && ratiosPass,
    purificationRatio: Number.isFinite(impermissible) ? impermissible : 0,
  };
}
