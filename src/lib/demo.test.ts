import { afterEach, describe, expect, it, vi } from "vitest";
import { demoEmail, isDemoUser } from "./demo";

afterEach(() => vi.unstubAllEnvs());

describe("demo account", () => {
  it("is off unless DEMO_EMAIL is set", () => {
    vi.stubEnv("DEMO_EMAIL", "");
    expect(demoEmail()).toBeNull();
    expect(isDemoUser({ email: "demo@mizan.app" })).toBe(false);
  });

  it("matches the configured address without regard to case or spaces", () => {
    vi.stubEnv("DEMO_EMAIL", " Demo@Mizan.app ");
    expect(isDemoUser({ email: "demo@mizan.app" })).toBe(true);
    expect(isDemoUser({ email: "DEMO@MIZAN.APP" })).toBe(true);
    expect(isDemoUser({ email: "someone@mizan.app" })).toBe(false);
    expect(isDemoUser(null)).toBe(false);
  });
});
