import { describe, it, expect } from "vitest";
import { LOCKOUT_MINUTES, isLocked, lockoutUntil } from "./login-throttle";

describe("login throttle", () => {
  const now = new Date("2026-10-02T12:00:00Z");

  it("is unlocked with no lock or a past lock", () => {
    expect(isLocked(null, now)).toBe(false);
    expect(isLocked("2026-10-02T11:59:59Z", now)).toBe(false);
    expect(isLocked("not a date", now)).toBe(false);
  });

  it("locks until the stored time", () => {
    const until = lockoutUntil(now);
    expect(Date.parse(until) - now.getTime()).toBe(LOCKOUT_MINUTES * 60_000);
    expect(isLocked(until, now)).toBe(true);
  });
});
