import { describe, expect, it } from "vitest";
import {
  crossRate,
  parseCurrencyApi,
  parseFrankfurter,
  parseGoldApi,
  plausibleMetals,
} from "./price-sources";

describe("price source parsing", () => {
  it("reads gold-api.com prices and rejects junk", () => {
    expect(parseGoldApi({ price: 2650.4, name: "Gold" })).toBe(2650.4);
    expect(parseGoldApi({ price: "2650" })).toBeNull();
    expect(parseGoldApi({ price: -1 })).toBeNull();
    expect(parseGoldApi(null)).toBeNull();
  });

  it("reads a frankfurter rate for the requested currency only", () => {
    const data = { amount: 1, base: "USD", rates: { CAD: 1.37 } };
    expect(parseFrankfurter(data, "CAD")).toBe(1.37);
    expect(parseFrankfurter(data, "GBP")).toBeNull();
    expect(parseFrankfurter({ message: "not found" }, "CAD")).toBeNull();
  });

  it("reads currency-api rates and inverts metal quotes to USD per ounce", () => {
    const data = { date: "2026-10-01", usd: { pkr: 280.5, xau: 1 / 2500, xag: 1 / 30 } };
    const { fx, metals } = parseCurrencyApi(data, "PKR");
    expect(fx).toBe(280.5);
    expect(metals?.gold).toBeCloseTo(2500, 6);
    expect(metals?.silver).toBeCloseTo(30, 6);
    expect(parseCurrencyApi(data, "USD").fx).toBe(1);
    expect(parseCurrencyApi(data, "XYZ").fx).toBeNull();
  });

  it("drops metal quotes that cannot be ounces of gold and silver", () => {
    // Quoted the other way round (USD per unit): reciprocals land near zero.
    const flipped = { usd: { xau: 2500, xag: 30 } };
    expect(parseCurrencyApi(flipped, "USD").metals).toBeNull();
    expect(parseCurrencyApi({ nope: true }, "USD")).toEqual({ fx: null, metals: null });
  });

  it("checks that a spot pair is believable", () => {
    expect(plausibleMetals({ gold: 2500, silver: 30 })).toBe(true);
    expect(plausibleMetals({ gold: 80, silver: 1 })).toBe(false); // per gram, not ounce
    expect(plausibleMetals({ gold: 2500, silver: 2500 })).toBe(false); // swapped feed
    expect(plausibleMetals({ gold: 2500, silver: 2 })).toBe(false);
  });
});

describe("crossRate", () => {
  it("divides through the dollar", () => {
    const data = { usd: { sar: 3.75, pkr: 280, cad: 1.4 } };
    expect(crossRate(data, "SAR", "PKR")).toBeCloseTo(280 / 3.75, 9);
    expect(crossRate(data, "USD", "CAD")).toBe(1.4);
    expect(crossRate(data, "SAR", "ZZZ")).toBeNull();
  });
});
