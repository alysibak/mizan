import { describe, expect, it } from "vitest";
import {
  allocateEnvelopes,
  impliedWealthFromZakat,
  whatIfNisab,
} from "./unique-calcs";

describe("impliedWealthFromZakat", () => {
  it("inverts 2.5%", () => {
    expect(impliedWealthFromZakat(250, "lunar")).toBeCloseTo(10_000, 5);
  });
});

describe("allocateEnvelopes", () => {
  it("splits evenly and preserves total", () => {
    const parts = allocateEnvelopes(100, { a: 1, b: 1, c: 1 });
    const sum = parts.reduce((s, p) => s + p.amount, 0);
    expect(sum).toBeCloseTo(100, 2);
    expect(parts).toHaveLength(3);
  });

  it("honors unequal weights", () => {
    const parts = allocateEnvelopes(90, { poor: 2, debt: 1 });
    const poor = parts.find((p) => p.key === "poor")!.amount;
    const debt = parts.find((p) => p.key === "debt")!.amount;
    expect(poor).toBeCloseTo(60, 1);
    expect(debt).toBeCloseTo(30, 1);
  });
});

describe("whatIfNisab", () => {
  it("flips when silver price rises", () => {
    const low = whatIfNisab({
      netZakatable: 1000,
      goldPricePerGram: 90,
      silverPricePerGram: 1,
      standard: "silver",
      basis: "lunar",
    });
    expect(low.meetsNisab).toBe(low.netZakatable >= low.chosenNisab);
    const high = whatIfNisab({
      ...low,
      silverPricePerGram: 5,
      goldPricePerGram: 90,
      netZakatable: 1000,
      standard: "silver",
      basis: "lunar",
    });
    expect(high.chosenNisab).toBeGreaterThan(low.chosenNisab);
  });
});
