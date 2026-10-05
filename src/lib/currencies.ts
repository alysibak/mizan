/** Common household currencies for quick pickers. Free-form ISO codes still allowed. */
export const COMMON_CURRENCIES = [
  "CAD",
  "USD",
  "GBP",
  "AED",
  "EUR",
  "AUD",
  "SAR",
  "MYR",
] as const;

/** "Pakistani Rupee" for PKR, in the reader's language; the code if unknown. */
export function currencyName(code: string, locale = "en"): string {
  try {
    return new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}
