export function formatMoney(amount: number, currency = "CAD"): string {
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${(amount || 0).toFixed(2)} ${currency}`;
  }
}

export function formatPercent(fraction: number, digits = 1): string {
  if (!Number.isFinite(fraction)) return "n/a";
  return `${(fraction * 100).toFixed(digits)}%`;
}
