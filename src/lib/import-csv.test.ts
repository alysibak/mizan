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
