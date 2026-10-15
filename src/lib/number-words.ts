/** Currencies whose people count in lakh and crore. */
const LAKH_CURRENCIES = new Set(["INR", "PKR", "BDT", "NPR", "LKR"]);

function compact(n: number, intl: string, digits: number): string {
  return new Intl.NumberFormat(intl, {
    notation: "compact",
    compactDisplay: "long",
    maximumFractionDigits: digits,
  }).format(n);
}

/**
 * A typed amount the way people say it, "25 lakh" or "2.5 million", so a
 * slipped zero shows at a glance. Urdu and Bengali count in lakh and crore
 * on their own; English does too when the money is rupees or taka. "≈" marks
 * a rounded figure. Null below a thousand, where the digits are plain enough.
 */
export function amountInWords(n: number, intl: string, currency?: string): string | null {
  if (!Number.isFinite(n) || n < 1000) return null;
  try {
    if (intl.startsWith("en") && currency && LAKH_CURRENCIES.has(currency) && n >= 100_000) {
      const [size, unit] = n >= 10_000_000 ? [10_000_000, "crore"] : [100_000, "lakh"];
      const short = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n / size);
      const exact = Math.round((n / size) * 100) / 100 === n / size;
      return `${exact ? "" : "≈ "}${short} ${unit}`;
    }
    const short = compact(n, intl, 2);
    return short === compact(n, intl, 12) ? short : `≈ ${short}`;
  } catch {
    return null;
  }
}
