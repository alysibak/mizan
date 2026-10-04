import { describe, it, expect } from "vitest";
import {
  calculateZakat,
  zakatRate,
  ZAKAT_RATE_LUNAR,
  ZAKAT_RATE_SOLAR,
  purificationAmount,
} from "./zakat";
import { nisabValue, goldNisabValue, silverNisabValue } from "./nisab";
import { hawlStatus, gregorianToHijri, hijriToGregorian, hawlDueDate } from "./hijri";
import { screenEquity } from "./screening";

const prices = { goldPricePerGram: 90, silverPricePerGram: 1.05 };

describe("nisab", () => {
  it("computes gold and silver nisab from weight and price", () => {
    expect(goldNisabValue(prices)).toBeCloseTo(7650);
    expect(silverNisabValue(prices)).toBeCloseTo(624.75);
  });
  it("selects the standard", () => {
    expect(nisabValue("gold", prices)).toBeCloseTo(7650);
    expect(nisabValue("silver", prices)).toBeCloseTo(624.75);
  });
});

describe("zakat rate", () => {
  it("is exactly one fortieth", () => {
    expect(ZAKAT_RATE_LUNAR).toBe(1 / 40);
  });

  it("is 2.5% on the lunar year", () => {
    expect(zakatRate("lunar")).toBe(ZAKAT_RATE_LUNAR);
    expect(ZAKAT_RATE_LUNAR).toBe(0.025);
  });
  it("is adjusted upward on the solar year", () => {
    expect(zakatRate("solar")).toBe(ZAKAT_RATE_SOLAR);
    expect(ZAKAT_RATE_SOLAR).toBeGreaterThan(0.0257);
    expect(ZAKAT_RATE_SOLAR).toBeLessThan(0.0258);
  });
});

describe("calculateZakat", () => {
  const base = {
    assets: [
      { category: "cash", label: "Cash", amount: 10000 },
      { category: "gold", label: "Gold", amount: 3000 },
      { category: "stocks_trading", label: "Stocks", amount: 5000 },
    ],
    liabilities: [{ label: "Card", amount: 2000, deductible: true }],
    prices,
    standard: "silver" as const,
    basis: "lunar" as const,
  };

  it("is due when wealth equals nisab exactly", () => {
    const silverNisab = 595 * 1.05;
    const r = calculateZakat({
      assets: [{ category: "cash", label: "Cash", amount: silverNisab }],
      liabilities: [],
      prices,
      standard: "silver",
      basis: "lunar",
    });
    expect(r.isDue).toBe(true);
    expect(r.zakatDue).toBeCloseTo(silverNisab * 0.025);
  });

  it("nets assets against deductible liabilities", () => {
    const r = calculateZakat(base);
    expect(r.grossZakatable).toBe(18000);
    expect(r.deductibleLiabilities).toBe(2000);
    expect(r.netZakatable).toBe(16000);
  });

  it("levies 2.5% when above nisab", () => {
    const r = calculateZakat(base);
    expect(r.isDue).toBe(true);
    expect(r.zakatDue).toBeCloseTo(400);
  });

  it("applies the solar adjustment", () => {
    const r = calculateZakat({ ...base, basis: "solar" });
    expect(r.zakatDue).toBeCloseTo(16000 * ZAKAT_RATE_SOLAR, 2);
    expect(r.zakatDue).toBeGreaterThan(400);
  });

  it("honours partial zakatable portions", () => {
    const r = calculateZakat({
      ...base,
      assets: [
        { category: "stocks_longterm", label: "Index", amount: 10000, zakatablePortion: 0.3 },
      ],
      liabilities: [],
    });
    expect(r.grossZakatable).toBe(3000);
  });

  it("ignores non-deductible liabilities", () => {
    const r = calculateZakat({
      ...base,
      liabilities: [{ label: "Mortgage", amount: 200000, deductible: false }],
    });
    expect(r.deductibleLiabilities).toBe(0);
    expect(r.netZakatable).toBe(18000);
  });

  it("is not due below nisab", () => {
    const r = calculateZakat({
      ...base,
      assets: [{ category: "cash", label: "Cash", amount: 100 }],
      liabilities: [],
    });
    expect(r.isDue).toBe(false);
    expect(r.zakatDue).toBe(0);
    expect(r.marginToNisab).toBeLessThan(0);
  });

  it("floors net wealth at zero when debts exceed assets", () => {
    const r = calculateZakat({
      ...base,
      assets: [{ category: "cash", label: "Cash", amount: 500 }],
      liabilities: [{ label: "Debt", amount: 5000, deductible: true }],
    });
    expect(r.netZakatable).toBe(0);
  });
});

describe("purification", () => {
  it("takes the impermissible fraction of income", () => {
    expect(purificationAmount(1000, 0.04)).toBeCloseTo(40);
    expect(purificationAmount(1000, 0)).toBe(0);
  });
});

describe("hawl", () => {
  it("converts Gregorian to the expected Hijri year", () => {
    const h = gregorianToHijri("2024-07-08");
    expect(h.year).toBe(1446);
    expect(h.month).toBe(1);
  });
  it("falls due about a lunar year later", () => {
    const due = hawlDueDate("2025-06-24");
    const days =
      (due.getTime() - new Date("2025-06-24").getTime()) / 86_400_000;
    expect(days).toBeGreaterThan(353);
    expect(days).toBeLessThan(356);
  });
  it("reports progress within the holding year", () => {
    const start = new Date(Date.now() - 177 * 86_400_000);
    const s = hawlStatus(start);
    expect(s.progress).toBeGreaterThan(0.45);
    expect(s.progress).toBeLessThan(0.55);
    expect(s.isComplete).toBe(false);
  });
});

describe("screening", () => {
  it("fails a company in an impermissible business", () => {
    const r = screenEquity(
      {
        alcohol: true,
        gambling: false,
        conventionalFinance: false,
        porkAndNonHalalFood: false,
        adultEntertainment: false,
        tobacco: false,
        weapons: false,
      },
      {
        marketCap: 1000,
        totalAssets: 1000,
        interestBearingDebt: 100,
        cashAndInterestSecurities: 100,
        totalRevenue: 1000,
        impermissibleRevenue: 0,
      },
    );
    expect(r.businessPass).toBe(false);
    expect(r.compliant).toBe(false);
  });

  it("passes a clean company within the ratio limits", () => {
    const r = screenEquity(
      {
        alcohol: false,
        gambling: false,
        conventionalFinance: false,
        porkAndNonHalalFood: false,
        adultEntertainment: false,
        tobacco: false,
        weapons: false,
      },
      {
        marketCap: 1000,
        totalAssets: 1000,
        interestBearingDebt: 200, // 20% < 30%
        cashAndInterestSecurities: 200, // 20% < 30%
        totalRevenue: 1000,
        impermissibleRevenue: 10, // 1% < 5%
      },
    );
    expect(r.businessPass).toBe(true);
    expect(r.ratiosPass).toBe(true);
    expect(r.compliant).toBe(true);
  });

  it("fails when debt exceeds the threshold", () => {
    const r = screenEquity(
      {
        alcohol: false,
        gambling: false,
        conventionalFinance: false,
        porkAndNonHalalFood: false,
        adultEntertainment: false,
        tobacco: false,
        weapons: false,
      },
      {
        marketCap: 1000,
        totalAssets: 1000,
        interestBearingDebt: 400, // 40% > 30%
        cashAndInterestSecurities: 100,
        totalRevenue: 1000,
        impermissibleRevenue: 0,
      },
    );
    expect(r.ratiosPass).toBe(false);
    expect(r.compliant).toBe(false);
  });
});

describe("screening edge cases", () => {
  const clean = {
    alcohol: false,
    gambling: false,
    conventionalFinance: false,
    porkAndNonHalalFood: false,
    adultEntertainment: false,
    tobacco: false,
    weapons: false,
  };

  it("does not fail a pre-revenue company on the income screen", () => {
    const r = screenEquity(clean, {
      marketCap: 1000,
      totalAssets: 1000,
      interestBearingDebt: 0,
      cashAndInterestSecurities: 0,
      totalRevenue: 0,
      impermissibleRevenue: 0,
    });
    expect(r.ratios[2].pass).toBe(true);
    expect(r.compliant).toBe(true);
  });

  it("still fails when the balance-sheet denominator is missing", () => {
    const r = screenEquity(clean, {
      marketCap: 0,
      totalAssets: 0,
      interestBearingDebt: 0,
      cashAndInterestSecurities: 0,
      totalRevenue: 100,
      impermissibleRevenue: 0,
    });
    expect(r.ratiosPass).toBe(false);
  });
});

describe("hijri calendar", () => {
  it("round-trips every day for a century", () => {
    for (let t = Date.UTC(1980, 0, 1); t < Date.UTC(2080, 0, 1); t += 86_400_000) {
      const h = gregorianToHijri(new Date(t));
      expect(h.day >= 1 && h.day <= 30 && h.month >= 1 && h.month <= 12).toBe(true);
      if (hijriToGregorian(h).getTime() !== t) {
        throw new Error(`round trip failed for ${new Date(t).toISOString()}`);
      }
    }
  });
});

describe("cent-exact totals", () => {
  it("adds many small entries without drift", () => {
    const r = calculateZakat({
      assets: Array.from({ length: 1000 }, (_, i) => ({ category: "cash", label: `c${i}`, amount: 0.1 })),
      liabilities: [{ label: "x", amount: 0.3 }],
      prices: { goldPricePerGram: 90, silverPricePerGram: 0.01 },
      standard: "silver",
      basis: "lunar",
    });
    expect(r.grossZakatable).toBe(100);
    expect(r.netZakatable).toBe(99.7);
  });
});
