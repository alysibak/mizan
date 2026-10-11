import { describe, it, expect } from "vitest";
import { hawlCalendar } from "./ics";

describe("hawlCalendar", () => {
  const now = new Date("2026-10-02T12:00:00Z");

  it("makes an all-day event with an optional reminder", () => {
    const ics = hawlCalendar({ dueDay: "2027-08-07", calendarLabel: "tabular", now, alarm: true });
    expect(ics).toContain("DTSTART;VALUE=DATE:20270807");
    expect(ics).toContain("DTEND;VALUE=DATE:20270808");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics.split("\r\n").filter((l) => l === "BEGIN:VEVENT")).toHaveLength(1);
  });

  it("is an empty calendar without a hawl", () => {
    expect(hawlCalendar({ dueDay: null, calendarLabel: "tabular", now })).not.toContain("VEVENT");
  });

  it("carries a title and note in the visitor's language, escaped", () => {
    const ics = hawlCalendar({
      dueDay: "2027-09-30",
      calendarLabel: "lunar",
      now,
      summary: "زکوٰۃ: دوبارہ حساب کا وقت",
      description: "One year, check the moon; then work it out again\\",
    });
    expect(ics).toContain("SUMMARY:زکوٰۃ: دوبارہ حساب کا وقت");
    expect(ics).toContain("DESCRIPTION:One year\\, check the moon\\; then work it out again\\\\");
  });

  it("never mentions money", () => {
    expect(hawlCalendar({ dueDay: "2027-08-07", calendarLabel: "tabular", now })).not.toMatch(/\$|zakat due|\d+\.\d\d/i);
  });
});
