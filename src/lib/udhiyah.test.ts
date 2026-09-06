import { describe, expect, it } from "vitest";
import { calculateUdhiyah, maxShares } from "./udhiyah";

describe("udhiyah", () => {
  it("splits a cow seven ways", () => {
    expect(maxShares("cow")).toBe(7);
    const r = calculateUdhiyah({
      animal: "cow",
      animalCost: 700,
      yourShares: 2,
      extras: 20,
    });
    expect(r.valid).toBe(true);
    expect(r.shareCost).toBe(100);
    expect(r.yourCost).toBe(200);
    expect(r.totalWithExtras).toBe(220);
  });

  it("treats sheep as one share", () => {
    const r = calculateUdhiyah({
      animal: "sheep",
      animalCost: 350,
      yourShares: 1,
    });
    expect(r.yourCost).toBe(350);
    expect(
      calculateUdhiyah({ animal: "sheep", animalCost: 350, yourShares: 2 }).valid,
    ).toBe(false);
  });
});
