import { describe, it, expect } from "vitest";
import { perGramFromPerOunce, TROY_OUNCE_GRAMS } from "./metals";

describe("perGramFromPerOunce", () => {
  it("divides a troy ounce into grams", () => {
    expect(perGramFromPerOunce(TROY_OUNCE_GRAMS)).toBeCloseTo(1);
  });
  it("applies an FX rate", () => {
    expect(perGramFromPerOunce(3110.34768, 1.1)).toBeCloseTo(110);
  });
});
