/** Round a purchase up to the next increment; the gap is the sadaqah suggestion. */
export function roundUpGap(spend: number, increment = 1): number {
  if (!Number.isFinite(spend) || spend <= 0) return 0;
  if (!Number.isFinite(increment) || increment <= 0) return 0;
  const rounded = Math.ceil(spend / increment - 1e-12) * increment;
  const gap = rounded - spend;
  return Number(Math.max(0, gap).toFixed(2));
}

export function roundUpTotal(spend: number, increment = 1): number {
  return Number((spend + roundUpGap(spend, increment)).toFixed(2));
}
