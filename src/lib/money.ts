/** A sum in a currency. `locale` is a BCP 47 tag; the app itself uses en-CA. */
export function formatMoney(amount: number, currency = "CAD", locale = "en-CA"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${(amount || 0).toFixed(2)} ${currency}`;
  }
}

export function formatPercent(fraction: number, digits = 1, locale?: string): string {
  if (!Number.isFinite(fraction)) return "n/a";
  if (!locale) return `${(fraction * 100).toFixed(digits)}%`;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fraction);
}

/** Round to the nearest cent. Money that is paid or recorded is always in cents. */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

/**
 * Add money in whole cents, so a long list of entries like 0.1 + 0.2 sums to
 * exactly 0.3 rather than drifting by fractions of a cent.
 */
export function sumCents(values: Iterable<number>): number {
  let cents = 0;
  for (const v of values) cents += Math.round((Number.isFinite(v) ? v : 0) * 100);
  return cents / 100;
}

/**
 * An amount for a prefilled form field or query string. Always two decimals,
 * so it passes `step="0.01"` validation in the giving form.
 */
export function amountParam(amount: number): string {
  return toCents(amount).toFixed(2);
}
