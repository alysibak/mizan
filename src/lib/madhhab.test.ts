import { describe, it, expect } from "vitest";
import {
  categoryForMadhhab,
  defaultPortion,
  parseMadhhab,
} from "./madhhab";

describe("madhhab defaults", () => {
  it("parses unknown as general", () => {
    expect(parseMadhhab("")).toBe("general");
    expect(parseMadhhab("hanafi")).toBe("hanafi");
  });

  it("exempts jewellery by default for Shafi'i", () => {
    expect(defaultPortion("jewellery", "shafii")).toBe(0);
    expect(categoryForMadhhab("jewellery", "shafii").portionEditable).toBe(true);
  });

  it("counts jewellery under Hanafi by default", () => {
    expect(defaultPortion("jewellery", "hanafi")).toBe(1);
  });

  it("does not invent school-specific equity percentages", () => {
    expect(defaultPortion("stocks_longterm", "hanafi")).toBe(
      defaultPortion("stocks_longterm", "maliki"),
    );
    expect(defaultPortion("stocks_longterm", "shafii")).toBe(0.25);
  });

  it("leaves cash fully zakatable in every school", () => {
    for (const m of ["general", "hanafi", "maliki", "shafii", "hanbali"] as const) {
      expect(defaultPortion("cash", m)).toBe(1);
    }
  });
});
