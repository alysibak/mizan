import { describe, expect, it } from "vitest";
import {
  CALC_FIELDS,
  computeDraft,
  currencyForLocale,
  decimalMarkFor,
  draftIsEmpty,
  draftToLedger,
  emptyDraft,
  parseAmount,
  parseDraft,
  parsePercent,
  parsePurity,
  type CalcDraft,
} from "./calculator";
import { CATEGORIES } from "./categories";

function draft(patch: Partial<CalcDraft>): CalcDraft {
  return { ...emptyDraft("CAD", "."), goldPrice: "90", silverPrice: "1.05", ...patch };
}

describe("parseAmount", () => {
  it.each([
    ["12500", 12500],
    ["12,500", 12500],
    ["12 500", 12500],
    ["$12,500.50", 12500.5],
    ["1,234,567.89", 1234567.89],
    ["1.234.567", 1234567],
    ["1.234,56", 1234.56],
    ["12,5", 12.5],
    ["0.75", 0.75],
    ["", 0],
    ["abc", 0],
    ["-500", 0],
  ])("%s → %s", (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });

  it("caps absurd figures", () => {
    expect(parseAmount("99999999999999999")).toBe(1e12);
  });

  it.each([
    // A small decimal-comma price must never become thousands.
    ["0,8812", null, 0.8812],
    ["0,881", null, 0.881],
    [",88", null, 0.88],
    ["12,3456", null, 12.3456],
    ["1,23,456", null, 123456], // lakh grouping
    ["12,", null, 12], // mid-typing
    // The one ambiguous shape follows the writer's locale.
    ["1,500", ".", 1500],
    ["1,500", ",", 1.5],
    ["1.500", ",", 1500],
    ["1.500", ".", 1.5],
    ["1.055", ".", 1.055], // a silver price per gram
    ["1,055", ",", 1.055],
  ] as const)("%s with decimal mark %s → %s", (raw, mark, expected) => {
    expect(parseAmount(raw, mark)).toBe(expected);
  });
});

describe("decimalMarkFor", () => {
  it.each([
    ["en-CA", "."],
    ["en-PK", "."],
    ["de-DE", ","],
    ["fr-FR", ","],
    ["tr-TR", ","],
    ["id-ID", ","],
    [null, "."],
  ])("%s → %s", (locale, mark) => {
    expect(decimalMarkFor(locale)).toBe(mark);
  });
});

describe("parsePercent and parsePurity", () => {
  it("reads percentages with a fallback", () => {
    expect(parsePercent("30", 0.25)).toBe(0.3);
    expect(parsePercent("", 0.25)).toBe(0.25);
    expect(parsePercent("150", 0.25)).toBe(1);
    expect(parsePercent("x", 0.25)).toBe(0.25);
  });

  it("reads fineness written several ways", () => {
    expect(parsePurity("0.916")).toBe(0.916);
    expect(parsePurity("91.6")).toBeCloseTo(0.916, 6);
    expect(parsePurity("916")).toBeCloseTo(0.916, 6);
    expect(parsePurity("22k")).toBeCloseTo(22 / 24, 6);
    expect(parsePurity("18 kt")).toBeCloseTo(0.75, 6);
    expect(parsePurity("")).toBe(1);
  });
});

describe("computeDraft", () => {
  it("matches the README's worked example", () => {
    // Cash 10,000 + gold 3,000 + trading 5,000 − credit card 2,000.
    const out = computeDraft(
      draft({
        amounts: { cash: "10000", gold: "3000", trading: "5000" },
        debts: "2000",
      }),
    );
    expect(out.result.grossZakatable).toBe(18000);
    expect(out.result.netZakatable).toBe(16000);
    expect(out.result.nisab).toBeCloseTo(624.75, 6);
    expect(out.result.isDue).toBe(true);
    expect(out.result.zakatDue).toBe(400);
    expect(out.needsPrices).toBe(false);
  });

  it("applies the solar rate and the gold standard when chosen", () => {
    const out = computeDraft(
      draft({ amounts: { bank: "16000" }, standard: "gold", basis: "solar" }),
    );
    expect(out.result.nisab).toBe(7650);
    // 16,000 × 2.5% × 365.25 / 354.367 = 412.28 (the README once said 412.43).
    expect(out.result.zakatDue).toBeCloseTo(412.28, 2);
  });

  it("counts long-term shares at the chosen share, 25% by default", () => {
    const base = computeDraft(draft({ amounts: { longterm: "10000" } }));
    expect(base.result.grossZakatable).toBe(2500);
    const custom = computeDraft(
      draft({ amounts: { longterm: "10000" }, portions: { longterm: "40" } }),
    );
    expect(custom.result.grossZakatable).toBe(4000);
  });

  it("leaves worn jewellery out unless the user counts it", () => {
    const off = computeDraft(draft({ amounts: { jewellery: "5000" } }));
    expect(off.result.grossZakatable).toBe(0);
    const on = computeDraft(draft({ amounts: { jewellery: "5000" }, jewelleryCounted: true }));
    expect(on.result.grossZakatable).toBe(5000);
  });

  it("values metal by weight and fineness from the price per gram", () => {
    const out = computeDraft(
      draft({ byWeight: { gold: true }, grams: { gold: "100" }, purity: { gold: "22k" } }),
    );
    // 100 g × 22/24 × 90 = 8,250
    expect(out.result.grossZakatable).toBe(8250);
    expect(out.lines[0]).toMatchObject({ grams: 100, metal: "gold" });
  });

  it("flags missing prices instead of inventing a nisab", () => {
    const out = computeDraft({
      ...emptyDraft("PKR"),
      amounts: { cash: "500000" },
      byWeight: { gold: true },
      grams: { gold: "20" },
    });
    expect(out.needsPrices).toBe(true);
    expect(out.needsWeightPrice).toBe(true);
    expect(out.result.isDue).toBe(false);
  });

  it("reads a German draft the German way", () => {
    const out = computeDraft({
      ...emptyDraft("EUR", ","),
      goldPrice: "85,40",
      silverPrice: "0,88",
      amounts: { bank: "12.500" },
    });
    expect(out.result.nisab).toBeCloseTo(595 * 0.88, 6);
    expect(out.result.netZakatable).toBe(12500);
    expect(out.result.zakatDue).toBe(312.5);
  });

  it("caps an impossible weight at what the ledger accepts", () => {
    const out = computeDraft(
      draft({ byWeight: { gold: true }, grams: { gold: "20000000000" }, purity: { gold: "1" } }),
    );
    expect(out.lines[0].grams).toBe(1e7);
  });

  it("is below nisab when debts outweigh holdings", () => {
    const out = computeDraft(draft({ amounts: { cash: "500" }, debts: "800" }));
    expect(out.result.netZakatable).toBe(0);
    expect(out.result.isDue).toBe(false);
    expect(out.result.zakatDue).toBe(0);
  });

  it("knows when nothing has been entered", () => {
    expect(draftIsEmpty(emptyDraft())).toBe(true);
    expect(draftIsEmpty(draft({ debts: "10" }))).toBe(false);
  });
});

describe("parseDraft", () => {
  it("round-trips a draft", () => {
    const d = draft({ amounts: { cash: "1,000" }, byWeight: { silver: true }, grams: { silver: "50" } });
    expect(parseDraft(JSON.stringify(d))).toEqual(d);
  });

  it("rejects or repairs anything it cannot trust", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("{")).toBeNull();
    expect(parseDraft(JSON.stringify({ v: 2 }))).toBeNull();
    const repaired = parseDraft(
      JSON.stringify({
        v: 1,
        currency: "<script>",
        standard: "platinum",
        amounts: { cash: 5, bank: "200", hacked: "1" },
        byWeight: { gold: "yes" },
      }),
    );
    expect(repaired).toMatchObject({
      currency: "USD",
      standard: "silver",
      amounts: { bank: "200" },
      byWeight: {},
    });
  });
});

describe("draftToLedger", () => {
  it("turns the draft into rows the ledger import accepts", () => {
    const out = draftToLedger(
      draft({
        amounts: { bank: "9000", longterm: "1000" },
        byWeight: { jewellery: true },
        grams: { jewellery: "30" },
        purity: { jewellery: "0.75" },
        debts: "250",
      }),
    );
    expect(out.assets).toEqual([
      { category: "bank", label: "Bank balances", amount: 9000, zakatablePortion: 1 },
      {
        category: "jewellery",
        label: "Gold jewellery you wear",
        amount: 2025,
        zakatablePortion: 0,
        grams: 30,
        purity: 0.75,
        metal: "gold",
      },
      {
        category: "stocks_longterm",
        label: "Long-term shares and funds",
        amount: 1000,
        zakatablePortion: 0.25,
      },
    ]);
    expect(out.liabilities).toEqual([{ label: "Debts due now", amount: 250, deductible: true }]);
  });

  it("uses only categories the ledger knows", () => {
    for (const f of CALC_FIELDS) expect(CATEGORIES[f.category]).toBeDefined();
  });
});

describe("currencyForLocale", () => {
  it.each([
    ["en-PK", "PKR"],
    ["ar-SA", "SAR"],
    ["ms-MY", "MYR"],
    ["en-GB", "GBP"],
    ["fr-FR", "EUR"],
    ["ar", "EGP"],
    ["xx-ZZ", "USD"],
    [null, "USD"],
  ])("%s → %s", (locale, currency) => {
    expect(currencyForLocale(locale)).toBe(currency);
  });
});
