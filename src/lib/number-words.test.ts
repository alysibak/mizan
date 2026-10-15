import { describe, expect, it } from "vitest";
import { amountInWords } from "./number-words";

describe("amountInWords", () => {
  it("leaves small amounts to the digits", () => {
    expect(amountInWords(999, "en-CA")).toBeNull();
    expect(amountInWords(0, "en-CA")).toBeNull();
    expect(amountInWords(Number.NaN, "en-CA")).toBeNull();
  });

  it("says thousands and millions in English", () => {
    expect(amountInWords(250_000, "en-CA", "USD")).toBe("250 thousand");
    expect(amountInWords(2_500_000, "en-CA", "GBP")).toBe("2.5 million");
  });

  it("says lakh and crore in English for rupees and taka", () => {
    expect(amountInWords(250_000, "en-CA", "PKR")).toBe("2.5 lakh");
    expect(amountInWords(2_500_000, "en-CA", "INR")).toBe("25 lakh");
    expect(amountInWords(30_000_000, "en-CA", "BDT")).toBe("3 crore");
    // Below a lakh it is plain thousands.
    expect(amountInWords(50_000, "en-CA", "PKR")).toBe("50 thousand");
  });

  it("counts in the reader's own words", () => {
    expect(amountInWords(2_500_000, "ur-PK-u-nu-latn", "PKR")).toBe("25 لاکھ");
    expect(amountInWords(2_500_000, "bn-BD-u-nu-latn", "BDT")).toBe("25 লাখ");
    expect(amountInWords(2_500_000, "id-ID", "IDR")).toBe("2,5 juta");
  });

  it("marks a rounded figure", () => {
    expect(amountInWords(12_345_678, "en-CA", "USD")).toBe("≈ 12.35 million");
    expect(amountInWords(12_345_678, "en-CA", "PKR")).toBe("≈ 1.23 crore");
  });
});
