import { describe, it, expect } from "vitest";
import { roundUpGap, roundUpTotal } from "./roundup";

describe("roundUpGap", () => {
  it("rounds 4.25 to the next dollar", () => {
    expect(roundUpGap(4.25, 1)).toBe(0.75);
    expect(roundUpTotal(4.25, 1)).toBe(5);
  });
  it("returns 0 on an even amount", () => {
    expect(roundUpGap(5, 1)).toBe(0);
  });
  it("supports a custom increment", () => {
    expect(roundUpGap(12.1, 5)).toBeCloseTo(2.9);
  });
  it("ignores non-positive input", () => {
    expect(roundUpGap(0)).toBe(0);
    expect(roundUpGap(-3)).toBe(0);
  });
});
