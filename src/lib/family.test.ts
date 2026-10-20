import { describe, expect, it } from "vitest";
import { familyOf, familyZakat, personFromNet, personZakat } from "./family";

const GOLD = 100; // per gram of pure gold
const NISAB = 714; // 595 g of silver at 1.2

describe("personZakat", () => {
  it("counts cash and gold by weight and purity, less their own debts", () => {
    const r = personZakat({ cash: 500, goldGrams: 10, goldPurity: 0.916, debts: 100 }, GOLD, NISAB);
    expect(r.owns).toBeCloseTo(1416);
    expect(r.net).toBeCloseTo(1316);
    expect(r.due).toBe(true);
    expect(r.zakat).toBe(32.9);
  });

  it("owes nothing below the nisab, and debts never make wealth negative", () => {
    expect(personZakat({ cash: 700, goldGrams: 0, goldPurity: 0.916, debts: 0 }, GOLD, NISAB).due).toBe(false);
    expect(personZakat({ cash: 100, goldGrams: 0, goldPurity: 0.916, debts: 500 }, GOLD, NISAB).net).toBe(0);
  });

  it("owes nothing while the nisab is unknown", () => {
    expect(personZakat({ cash: 10_000, goldGrams: 0, goldPurity: 1, debts: 0 }, GOLD, 0).due).toBe(false);
  });
});

describe("familyZakat", () => {
  it("works out each person alone and adds up what is owed", () => {
    const r = familyZakat(
      [
        { cash: 2000, goldGrams: 0, goldPurity: 0.916, debts: 0 },
        { cash: 0, goldGrams: 50, goldPurity: 0.916, debts: 0 },
      ],
      GOLD,
      NISAB,
    );
    expect(r.people.map((p) => p.zakat)).toEqual([50, 114.5]);
    expect(r.total).toBe(164.5);
    expect(r.poolingMisleads).toBe(false);
  });

  it("notices when adding everyone together would wrongly make zakat due", () => {
    // 500 + 400 is over 714 together, but neither owes alone.
    const r = familyZakat(
      [
        { cash: 500, goldGrams: 0, goldPurity: 0.916, debts: 0 },
        { cash: 400, goldGrams: 0, goldPurity: 0.916, debts: 0 },
      ],
      GOLD,
      NISAB,
    );
    expect(r.total).toBe(0);
    expect(r.pooled).toBe(900);
    expect(r.poolingMisleads).toBe(true);
  });
});

describe("personFromNet", () => {
  it("weighs figures worked out in the calculator against the family's nisab", () => {
    const me = personFromNet(2500, 2000, NISAB);
    expect(me).toEqual({ owns: 2500, net: 2000, due: true, zakat: 50 });
    const family = familyOf([me, personZakat({ cash: 400, goldGrams: 0, goldPurity: 1, debts: 0 }, GOLD, NISAB)], NISAB);
    expect(family.total).toBe(50);
    expect(family.poolingMisleads).toBe(true);
  });
});
