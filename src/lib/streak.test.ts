import { describe, expect, it } from "vitest";
import { dayKey, monthCount, monthGrid, streak } from "./streak";

const today = new Date(2026, 9, 15); // 15 October 2026, a Thursday

describe("streak", () => {
  it("counts days in a row ending today", () => {
    expect(streak(new Set(["2026-10-13", "2026-10-14", "2026-10-15"]), today)).toBe(3);
  });

  it("keeps yesterday's streak alive until today is over", () => {
    expect(streak(new Set(["2026-10-13", "2026-10-14"]), today)).toBe(2);
  });

  it("is broken by a missed day", () => {
    expect(streak(new Set(["2026-10-12", "2026-10-14", "2026-10-15"]), today)).toBe(2);
    expect(streak(new Set(["2026-10-12"]), today)).toBe(0);
  });

  it("runs across the end of a month", () => {
    expect(streak(new Set(["2026-09-30", "2026-10-01"]), new Date(2026, 9, 1))).toBe(2);
  });
});

describe("monthCount and monthGrid", () => {
  it("counts only this month's days", () => {
    expect(monthCount(new Set(["2026-09-30", "2026-10-01", "2026-10-15"]), today)).toBe(2);
  });

  it("lays out the month Monday first", () => {
    const weeks = monthGrid(today);
    // 1 October 2026 is a Thursday: three blanks, then the 1st.
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null]);
    expect(weeks[0][3] && dayKey(weeks[0][3])).toBe("2026-10-01");
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });
});
