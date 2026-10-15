import { describe, it, expect } from "vitest";
import { tenNightsPlan } from "./ten-nights";

const start = new Date("2027-02-08T00:00:00Z"); // 1 Ramadan 1448 (Umm al-Qura)
const eid30 = new Date("2027-03-10T00:00:00Z");
const eid29 = new Date("2027-03-09T00:00:00Z");

describe("tenNightsPlan", () => {
  it("splits evenly over ten nights, each on its evening", () => {
    const plan = tenNightsPlan(100, start, eid30);
    expect(plan.map((n) => n.night)).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
    expect(plan[0].evening).toBe("2027-02-27"); // the evening of 20 Ramadan
    expect(plan.every((n) => n.amount === 10)).toBe(true);
  });

  it("gives the odd nights more when asked, and always adds up exactly", () => {
    const plan = tenNightsPlan(100, start, eid30, 2);
    expect(plan.find((n) => n.night === 21)?.amount).toBe(13.33);
    expect(plan.find((n) => n.night === 22)?.amount).toBe(6.66);
    const sum = plan.reduce((s, n) => s + Math.round(n.amount * 100), 0);
    expect(sum).toBe(10000);
  });

  it("has nine nights when Ramadan has 29 days, and nothing for nothing", () => {
    expect(tenNightsPlan(90, start, eid29)).toHaveLength(9);
    expect(tenNightsPlan(0, start, eid30)).toEqual([]);
    expect(tenNightsPlan(Number.NaN, start, eid30)).toEqual([]);
  });

  it("plans only the nights still to come when made during Ramadan", () => {
    const plan = tenNightsPlan(60, start, eid30, 1, 25);
    expect(plan.map((n) => n.night)).toEqual([25, 26, 27, 28, 29, 30]);
    expect(plan.every((n) => n.amount === 10)).toBe(true);
    expect(tenNightsPlan(60, start, eid29, 1, 31)).toEqual([]);
  });
});
