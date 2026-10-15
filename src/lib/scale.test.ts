import { describe, it, expect } from "vitest";
import { scaleAngle } from "./scale";

describe("scaleAngle", () => {
  it("tips towards savings above nisab, towards nisab below, level when equal", () => {
    expect(scaleAngle(2000, 1000)).toBeLessThan(0);
    expect(scaleAngle(500, 1000)).toBeGreaterThan(0);
    expect(scaleAngle(1000, 1000)).toBe(0);
  });

  it("never tips past the limit, even for nothing or a fortune", () => {
    expect(scaleAngle(0, 1000)).toBe(14);
    expect(scaleAngle(10_000_000, 1000)).toBeGreaterThanOrEqual(-14);
    expect(scaleAngle(-50, 1000)).toBe(14);
    expect(scaleAngle(0, 0)).toBe(0);
  });
});
