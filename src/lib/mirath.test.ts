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

const share = (r: ReturnType<typeof distributeEstate>, heir: string) =>
  r.shares.find((s) => s.heir === heir)?.fraction.toString();

describe("Umariyyatan (Gharrawayn)", () => {
  it("gives the mother a third of the remainder with a husband", () => {
    const r = distributeEstate({ husband: 1, mother: 1, father: 1 });
    expect([share(r, "husband"), share(r, "mother"), share(r, "father")]).toEqual(["1/2", "1/6", "1/3"]);
  });

  it("still applies when blocked grandparents are also entered", () => {
    const r = distributeEstate({
      husband: 1,
      mother: 1,
      father: 1,
      maternalGrandmother: 1,
      paternalGrandfather: 1,
    });
    expect([share(r, "husband"), share(r, "mother"), share(r, "father")]).toEqual(["1/2", "1/6", "1/3"]);
    expect(r.blocked.map((b) => b.heir).sort()).toEqual(["maternalGrandmother", "paternalGrandfather"]);
  });

  it("still applies with a single sibling, who is blocked by the father", () => {
    const r = distributeEstate({ wife: 1, mother: 1, father: 1, fullBrother: 1 });
    expect([share(r, "wife"), share(r, "mother"), share(r, "father")]).toEqual(["1/4", "1/4", "1/2"]);
    expect(r.blocked).toContainEqual({ heir: "fullBrother", by: "Father" });
  });

  it("gives way to the 1/6 rule when two siblings reduce the mother", () => {
    const r = distributeEstate({ husband: 1, mother: 1, father: 1, fullBrother: 2 });
    expect([share(r, "husband"), share(r, "mother"), share(r, "father")]).toEqual(["1/2", "1/6", "1/3"]);
  });
});

describe("awl", () => {
  it("resolves the Minbariyya over 27", () => {
    const r = distributeEstate({ wife: 1, daughter: 2, father: 1, mother: 1 });
    expect(r.awlApplied).toBe(true);
    expect([share(r, "wife"), share(r, "daughter"), share(r, "father"), share(r, "mother")]).toEqual([
      "1/9",
      "16/27",
      "4/27",
      "4/27",
    ]);
    expect(r.totalDistributed.toString()).toBe("1");
  });

  it("reports a son's son left with nothing", () => {
    const r = distributeEstate({ husband: 1, father: 1, mother: 1, daughter: 2, sonsSon: 1 });
    expect(r.awlApplied).toBe(true);
    expect(share(r, "sonsSon")).toBeUndefined();
    expect(r.blocked.some((b) => b.heir === "sonsSon")).toBe(true);
  });
});

describe("Mushtaraka", () => {
  it("names the school difference instead of silently dropping the full brother", () => {
    const r = distributeEstate({ husband: 1, mother: 1, maternalBrother: 2, fullBrother: 1 });
    expect([share(r, "husband"), share(r, "mother"), share(r, "maternalBrother")]).toEqual(["1/2", "1/6", "1/3"]);
    expect(share(r, "fullBrother")).toBeUndefined();
    expect(r.blocked.some((b) => b.heir === "fullBrother")).toBe(true);
    expect(r.notes.join(" ")).toMatch(/Mushtaraka/);
  });
});

describe("input limits", () => {
  it("caps wives at four, sharing the eighth", () => {
    const r = distributeEstate({ wife: 6, son: 1 });
    const wives = r.shares.find((s) => s.heir === "wife")!;
    expect(wives.count).toBe(4);
    expect(wives.fraction.toString()).toBe("1/8");
    expect(wives.perHead.toString()).toBe("1/32");
  });

  it("refuses a husband and a wife together", () => {
    const r = distributeEstate({ husband: 1, wife: 1, son: 1 });
    expect(share(r, "wife")).toBeUndefined();
    expect(r.notes.join(" ")).toMatch(/husband and a wife/);
  });

  it("says when nobody listed inherits", () => {
    const r = distributeEstate({});
    expect(r.shares).toHaveLength(0);
    expect(r.toTreasury.toString()).toBe("1");
    expect(r.notes[0]).toMatch(/No heir/);
  });

  it("flags that radd assumes no distant male-line relatives", () => {
    const r = distributeEstate({ daughter: 1, mother: 1 });
    expect(r.raddApplied).toBe(true);
    expect(r.notes.join(" ")).toMatch(/paternal uncles/);
  });
});

describe("totals", () => {
  it("always distributes exactly the estate, less any treasury share", () => {
    const cases = [
      { son: 2, daughter: 3, wife: 2, mother: 1, father: 1 },
      { husband: 1, daughter: 1, sonsDaughter: 2, fullSister: 1 },
      { wife: 1, maternalSister: 2, fullBrother: 1, fullSister: 2 },
      { mother: 1, paternalGrandmother: 1, paternalSister: 3 },
    ];
    for (const heirs of cases) {
      const r = distributeEstate(heirs);
      expect(r.totalDistributed.add(r.toTreasury).toString()).toBe("1");
    }
  });
});
