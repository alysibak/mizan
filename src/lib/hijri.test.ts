import { describe, it, expect } from "vitest";
import { gregorianToHijri, hawlDueDate, hijriToGregorian, formatHijri } from "./hijri";

describe("Umm al-Qura", () => {
  it("matches the published 1 Muharram 1446 (7 July 2024)", () => {
    expect(gregorianToHijri("2024-07-07", "umalqura")).toEqual({ year: 1446, month: 1, day: 1 });
    // The tabular calendar puts it a day later.
    expect(gregorianToHijri("2024-07-07", "tabular").day).toBe(30);
  });

  it("round-trips every day across five years", () => {
    for (let t = Date.UTC(2023, 0, 1); t < Date.UTC(2028, 0, 1); t += 86_400_000) {
      const h = gregorianToHijri(new Date(t), "umalqura");
      if (hijriToGregorian(h, "umalqura").getTime() !== t) {
        throw new Error(`round trip failed for ${new Date(t).toISOString()}`);
      }
    }
  });

  it("falls due one Umm al-Qura year later", () => {
    const due = hawlDueDate("2024-07-07", "umalqura");
    expect(gregorianToHijri(due, "umalqura")).toEqual({ year: 1447, month: 1, day: 1 });
    expect(formatHijri(due, "umalqura")).toBe("1 Muharram 1447 AH");
  });

  it("lands on the next day when the anniversary month is short", () => {
    // Find a day 30 whose month a year later has 29 days.
    for (let t = Date.UTC(2024, 0, 1); t < Date.UTC(2026, 0, 1); t += 86_400_000) {
      const h = gregorianToHijri(new Date(t), "umalqura");
      if (h.day !== 30) continue;
      const due = hawlDueDate(new Date(t), "umalqura");
      const dh = gregorianToHijri(due, "umalqura");
      const sameDay = dh.year === h.year + 1 && dh.month === h.month && dh.day === 30;
      const rolledOver =
        dh.day === 1 &&
        dh.month === (h.month % 12) + 1 &&
        dh.year === h.year + 1 + (h.month === 12 ? 1 : 0);
      expect(sameDay || rolledOver).toBe(true);
    }
  });
});
