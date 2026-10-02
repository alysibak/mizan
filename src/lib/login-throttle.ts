// Per-account sign-in throttle. After MAX_FAILED_LOGINS wrong passwords in a
// row the account refuses sign-in for LOCKOUT_MINUTES, then allows another
// round. That caps online guessing at a few dozen tries an hour per account
// without needing a shared cache, which serverless hosting does not provide.

export const MAX_FAILED_LOGINS = 10;
export const LOCKOUT_MINUTES = 15;

export function isLocked(
  lockedUntil: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!lockedUntil) return false;
  const until = Date.parse(lockedUntil);
  return Number.isFinite(until) && until > now.getTime();
}

/** The lock expiry to store when a failure reaches the limit. */
export function lockoutUntil(now: Date = new Date()): string {
  return new Date(now.getTime() + LOCKOUT_MINUTES * 60_000).toISOString();
}
