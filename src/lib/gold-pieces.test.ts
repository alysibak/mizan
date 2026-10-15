import { describe, it, expect } from "vitest";
import { inUnit, piecesGrams } from "./gold-pieces";

describe("gold pieces", () => {
  it("adds up typical weights", () => {
    expect(piecesGrams({})).toBe(0);
    expect(piecesGrams({ ring: 2, bangle: 4 })).toBe(56);
    expect(piecesGrams({ ring: -3, necklace: 1.7 })).toBe(25);
  });

  it("writes the total in grams or tola", () => {
    expect(inUnit(56, "g")).toBe("56");
    expect(inUnit(11.6638, "tola")).toBe("1");
    expect(inUnit(56, "tola")).toBe("4.8");
  });
});
