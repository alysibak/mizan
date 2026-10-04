/**
 * "Today" for a user, as the UTC midnight of their local calendar day. Hawl
 * and payment windows compare UTC calendar days, so this keeps a user in
 * Toronto from seeing tomorrow's date after 8 pm.
 */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function userToday(timeZone: string | null | undefined, now: Date = new Date()): Date {
  if (timeZone && isValidTimeZone(timeZone)) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** The user's local calendar day as YYYY-MM-DD. */
export function userTodayIso(timeZone: string | null | undefined, now?: Date): string {
  return userToday(timeZone, now).toISOString().slice(0, 10);
}
