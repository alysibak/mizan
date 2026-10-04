import { describe, it, expect } from "vitest";
import {
  metalFor,
  perGramFromPerOunce,
  pricePerGram,
  TROY_OUNCE_GRAMS,
  valueByWeight,
} from "./metals";
import { normalizeAsset } from "./asset-write";

describe("perGramFromPerOunce", () => {
  it("divides a troy ounce into grams", () => {
    expect(perGramFromPerOunce(TROY_OUNCE_GRAMS)).toBeCloseTo(1);
  });
  it("applies an FX rate", () => {
    expect(perGramFromPerOunce(3110.34768, 1.1)).toBeCloseTo(110);
  });
});

describe("weighed holdings", () => {
  const prices = { goldPricePerGram: 120, silverPricePerGram: 1.5 };

  it("prices by fineness and weight, to the cent", () => {
    expect(valueByWeight(10, 0.916, 120)).toBe(1099.2);
    expect(valueByWeight(0, 1, 120)).toBe(0);
    expect(valueByWeight(10, 1.5, 120)).toBe(1200);
  });

  it("follows the category's metal, or the chosen one for jewellery", () => {
    expect(metalFor("gold")).toBe("gold");
    expect(metalFor("silver", "gold")).toBe("silver");
    expect(metalFor("jewellery", "silver")).toBe("silver");
    expect(metalFor("jewellery")).toBe("gold");
    expect(metalFor("cash")).toBeNull();
    expect(pricePerGram("silver", prices)).toBe(1.5);
  });

  it("revalues on write and drops weight from other categories", () => {
    expect(
      normalizeAsset({ category: "jewellery", amount: 1, grams: 100, purity: 0.925, metal: "silver" }, prices, "CAD"),
    ).toMatchObject({ amount: 138.75, grams: 100, purity: 0.925, metal: "silver", fxRate: null });
    expect(normalizeAsset({ category: "cash", amount: 50, grams: 10 }, prices, "CAD")).toMatchObject({
      amount: 50,
      grams: null,
      purity: null,
      metal: null,
    });
    expect(normalizeAsset({ category: "gold", amount: 50, grams: null }, prices, "CAD").amount).toBe(50);
  });

  it("converts a holding in another currency at the user's rate", () => {
    const usd = { category: "bank", amount: 0, foreignCurrency: "usd", foreignAmount: 1000, fxRate: 1.3725 };
    expect(normalizeAsset(usd, prices, "CAD")).toMatchObject({
      amount: 1372.5,
      foreignCurrency: "USD",
      foreignAmount: 1000,
      fxRate: 1.3725,
    });
    // Same as the base currency, or no rate: just a plain amount.
    expect(normalizeAsset({ ...usd, amount: 7 }, prices, "USD")).toMatchObject({ amount: 7, foreignCurrency: null });
    expect(normalizeAsset({ ...usd, amount: 7, fxRate: null }, prices, "CAD").foreignCurrency).toBeNull();
  });
});
