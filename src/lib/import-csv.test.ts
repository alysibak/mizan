import { describe, it, expect } from "vitest";
import { parseAssetCsv, guessCategory } from "./import-csv";

describe("guessCategory", () => {
  it("maps common bank and broker labels", () => {
    expect(guessCategory("Chequing")).toBe("bank");
    expect(guessCategory("TFSA brokerage")).toBe("stocks_longterm");
    expect(guessCategory("Bitcoin")).toBe("crypto");
    expect(guessCategory("Gold coins")).toBe("gold");
    expect(guessCategory("RRSP pension")).toBe("pension");
  });
});

describe("parseAssetCsv", () => {
  it("reads a headered export", () => {
    const { rows, errors } = parseAssetCsv(`category,label,amount
bank,Chequing,9,500.00
gold,Coins,3200`);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      category: "bank",
      label: "Chequing",
      amount: 9500,
    });
  });

  it("reads label,amount with inferred category", () => {
    const { rows, errors } = parseAssetCsv(`Wealthsimple TFSA,12000
Petty cash,80`);
    expect(errors).toEqual([]);
    expect(rows[0].category).toBe("stocks_longterm");
    expect(rows[0].amount).toBe(12000);
    expect(rows[1].category).toBe("cash");
  });

  it("applies a zakatable portion column", () => {
    const { rows } = parseAssetCsv(
      `category,label,amount,portion
stocks_longterm,Index,10000,0.25`,
    );
    expect(rows[0].zakatablePortion).toBe(0.25);
  });
});

describe("parseAssetCsv safety", () => {
  it("refuses negative and bracketed amounts instead of counting debts as wealth", () => {
    const { rows, errors } = parseAssetCsv(`label,amount
Overdraft,-500
Visa,(250.00)
Chequing,$1,200.50`);
    expect(rows).toEqual([
      expect.objectContaining({ label: "Chequing", amount: 1200.5 }),
    ]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/negative/);
  });

  it("reads a percent sign as a percentage", () => {
    const { rows } = parseAssetCsv(`category,label,amount,portion
stocks_longterm,Index,1000,1%
stocks_longterm,Fund,1000,30
stocks_longterm,ETF,1000,0.4`);
    expect(rows.map((r) => r.zakatablePortion)).toEqual([0.01, 0.3, 0.4]);
  });

  it("uses the supplied default portion for school-aware categories", () => {
    const { rows } = parseAssetCsv("Gold necklace,800", () => 1);
    expect(rows[0]).toMatchObject({ category: "jewellery", zakatablePortion: 1 });
  });
});

describe("headerless thousands", () => {
  it("rejoins unquoted thousands separators", () => {
    const { rows, errors } = parseAssetCsv(`Chequing,1,234.56
bank,Savings,12,500,0.5
Brokerage,1,000,000
Cash,80`);
    expect(errors).toEqual([]);
    expect(rows.map((r) => [r.label, r.amount])).toEqual([
      ["Chequing", 1234.56],
      ["Savings", 12500],
      ["Brokerage", 1000000],
      ["Cash", 80],
    ]);
    expect(rows[1]).toMatchObject({ category: "bank", zakatablePortion: 0.5 });
  });

  it("still reads category,label,amount rows", () => {
    const { rows } = parseAssetCsv("gold,Coins,3200");
    expect(rows[0]).toMatchObject({ category: "gold", label: "Coins", amount: 3200 });
  });
});
