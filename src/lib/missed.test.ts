import { describe, it, expect } from "vitest";
import { MAX_MISSED_YEARS, missedZakat } from "./missed";

describe("missedZakat", () => {
  it("owes 2.5% of each year's savings, added up", () => {
    expect(missedZakat([10000, 8000, 0])).toMatchObject({
      valid: true,
      perYear: [250, 200, 0],
      total: 450,
      perMonth: 450,
    });
  });

  it("spreads the total over months without falling short", () => {
    const plan = missedZakat([4000], 3);
    expect(plan.total).toBe(100);
    expect(plan.perMonth).toBe(33.34);
    expect(plan.perMonth * 3).toBeGreaterThanOrEqual(plan.total);
    expect(missedZakat([4800], 12).perMonth).toBe(10);
  });

  it("asks for at least one year above nothing, and sensible numbers", () => {
    expect(missedZakat([]).valid).toBe(false);
    expect(missedZakat([0, 0]).valid).toBe(false);
    expect(missedZakat([-5]).valid).toBe(false);
    expect(missedZakat([Number.NaN]).valid).toBe(false);
    expect(missedZakat([1000], 0).valid).toBe(false);
    expect(missedZakat(Array(MAX_MISSED_YEARS + 1).fill(1000)).valid).toBe(false);
    expect(missedZakat(Array(MAX_MISSED_YEARS).fill(1000)).total).toBe(1500);
  });
});
