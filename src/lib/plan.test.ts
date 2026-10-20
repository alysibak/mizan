import { describe, expect, it } from "vitest";
import { buildPlan, type Situation } from "./plan";

const plan = (...have: Situation[]) => buildPlan(new Set(have)).map((s) => s.key);

describe("buildPlan", () => {
  it("is empty until something is chosen", () => {
    expect(plan()).toEqual([]);
  });

  it("sends savings and gold to the step-by-step guide, then to giving and keeping track", () => {
    expect(plan("money", "gold")).toEqual(["guide", "give", "my"]);
  });

  it("sets interest aside before anything is counted", () => {
    expect(plan("money", "interest")).toEqual(["interest", "guide", "give", "my"]);
  });

  it("counts a shop with savings on the shop page, not twice", () => {
    expect(plan("shop", "money", "family")).toEqual(["shop", "give", "my"]);
  });

  it("counts a family person by person", () => {
    expect(plan("family", "gold")).toEqual(["family", "give", "my"]);
  });

  it("puts this year before past years, and farms on their own", () => {
    expect(plan("unsure", "money", "farm", "missed")).toEqual(["start", "guide", "farm", "missed", "give", "my"]);
  });

  it("asks nothing to be given when only unsure", () => {
    expect(plan("unsure")).toEqual(["start"]);
  });
});
