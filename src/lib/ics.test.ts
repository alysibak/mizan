import { describe, it, expect } from "vitest";
import { eveningsCalendar, hawlCalendar } from "./ics";

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

describe("eveningsCalendar", () => {
  it("has one evening event per night, with an alert, at local time", () => {
    const ics = eveningsCalendar({
      uid: "nights",
      time: "19:30",
      now: new Date("2026-10-14T00:00:00Z"),
      events: [
        { day: "2027-02-27", summary: "Night 21: give $10", description: "Last ten nights, plan" },
        { day: "2027-02-28", summary: "Night 22: give $10", description: "Last ten nights" },
      ],
    });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("DTSTART:20270227T193000");
    expect(ics).toContain("DTEND:20270227T194500");
    expect(ics).toContain("DESCRIPTION:Last ten nights\\, plan");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });
});


describe("daysCalendar", () => {
  it("makes one whole-day event per date, each reminded a week before and on the morning", async () => {
    const { daysCalendar } = await import("./ics");
    const ics = daysCalendar({
      uid: "zakat-day",
      now: new Date("2026-10-20T12:00:00Z"),
      events: [
        { day: "2027-02-08", summary: "Zakat day", description: "Work out and give your zakat." },
        { day: "2028-01-28", summary: "Zakat day", description: "Work out and give your zakat." },
      ],
    });
    expect(ics.split("\r\n").filter((l) => l === "BEGIN:VEVENT")).toHaveLength(2);
    expect(ics).toContain("DTSTART;VALUE=DATE:20270208");
    expect(ics).toContain("DTEND;VALUE=DATE:20270209");
    expect(ics).toContain("TRIGGER:-P7D");
    expect(ics).toContain("TRIGGER:PT9H");
    expect(ics).toContain("UID:zakat-day-20280128@mizan.app");
  });

  it("can leave out the week-before reminder, for something every month", async () => {
    const { daysCalendar } = await import("./ics");
    const ics = daysCalendar({
      uid: "zakat-month",
      weekBefore: false,
      events: [{ day: "2026-11-20", summary: "Zakat: US$125.00", description: "From your monthly plan." }],
    });
    expect(ics).not.toContain("TRIGGER:-P7D");
    expect(ics).toContain("TRIGGER:PT9H");
  });
});
