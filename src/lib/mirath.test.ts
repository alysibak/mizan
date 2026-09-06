import { describe, it, expect } from "vitest";
import { distributeEstate } from "./mirath";

describe("distributeEstate", () => {
  it("gives a husband and a full sister each one half", () => {
    const r = distributeEstate({ husband: 1, fullSister: 1 });
    const hus = r.shares.find((s) => s.heir === "husband")!;
    const sis = r.shares.find((s) => s.heir === "fullSister")!;
    expect(hus.fraction.toString()).toBe("1/2");
    expect(sis.fraction.toString()).toBe("1/2");
    expect(r.awlApplied).toBe(false);
  });

  it("gives a sole son the entire estate as residuary", () => {
    const r = distributeEstate({ son: 1 });
    expect(r.shares).toHaveLength(1);
    expect(r.shares[0].fraction.toString()).toBe("1");
    expect(r.shares[0].basis).toBe("asaba");
  });

  it("returns surplus to two daughters by radd when they are the only heirs", () => {
    const r = distributeEstate({ daughter: 2 });
    expect(r.raddApplied).toBe(true);
    expect(r.shares[0].fraction.toString()).toBe("1");
  });

  it("leaves a remainder for the treasury when only a husband inherits a fixed share", () => {
    const r = distributeEstate({ husband: 1 });
    expect(r.shares[0].fraction.toString()).toBe("1/2");
    expect(r.toTreasury.toString()).toBe("1/2");
  });
});
