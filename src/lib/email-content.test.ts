import { describe, expect, it } from "vitest";
import {
  REMINDER_LEAD_DAYS,
  reminderDue,
  reminderEmailMessage,
  reminderKey,
  resetEmailMessage,
  verifyEmailMessage,
} from "./email-content";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("reminderDue", () => {
  it("is quiet until a week before the hawl day", () => {
    expect(reminderDue("2026-11-20", day("2026-11-01"))).toBeNull();
    expect(reminderDue("2026-11-20", day("2026-11-12"))).toBeNull();
  });

  it("sends the lead reminder in the last seven days, with the days left", () => {
    expect(REMINDER_LEAD_DAYS).toBe(7);
    expect(reminderDue("2026-11-20", day("2026-11-13"))).toEqual({ kind: "week", daysLeft: 7 });
    expect(reminderDue("2026-11-20", day("2026-11-19"))).toEqual({ kind: "week", daysLeft: 1 });
  });

  it("sends the day-of reminder on the day, or a little late if a run was missed", () => {
    expect(reminderDue("2026-11-20", day("2026-11-20"))).toEqual({ kind: "day", daysLeft: 0 });
    expect(reminderDue("2026-11-20", day("2026-11-22"))).toEqual({ kind: "day", daysLeft: -2 });
  });

  it("says nothing about a hawl day long past", () => {
    expect(reminderDue("2026-11-20", day("2026-11-23"))).toBeNull();
    expect(reminderDue("2025-08-01", day("2026-11-20"))).toBeNull();
  });

  it("keys each reminder by its hawl day, so the next year starts fresh", () => {
    expect(reminderKey("2026-11-20", "week")).toBe("2026-11-20:week");
    expect(reminderKey("2027-11-09", "week")).not.toBe(reminderKey("2026-11-20", "week"));
  });
});

describe("email messages", () => {
  it("never carry amounts", () => {
    const messages = [
      verifyEmailMessage({ to: "a@b.c", name: "Aisha Khan", link: "https://m.app/x" }),
      resetEmailMessage({ to: "a@b.c", link: "https://m.app/y" }),
      reminderEmailMessage({
        to: "a@b.c",
        name: "Aisha Khan",
        dueDay: "2026-11-20",
        due: { kind: "week", daysLeft: 3 },
        calendar: "tabular",
        link: "https://m.app/year",
      }),
    ];
    for (const m of messages) {
      expect(m.text).not.toMatch(/[$£€]\s?\d|\d+\.\d{2}\b/);
      expect(m.to).toBe("a@b.c");
    }
  });

  it("greet by first name and include the link", () => {
    const m = verifyEmailMessage({ to: "a@b.c", name: "  Aisha  Khan ", link: "https://m.app/v?t=1" });
    expect(m.text).toContain("Assalamu alaikum Aisha,");
    expect(m.text).toContain("https://m.app/v?t=1");
  });

  it("date the reminder in both calendars", () => {
    const m = reminderEmailMessage({
      to: "a@b.c",
      name: "Yusuf",
      dueDay: "2026-11-20",
      due: { kind: "day", daysLeft: 0 },
      calendar: "tabular",
      link: "https://m.app/year",
    });
    expect(m.subject).toBe("Your zakat year is complete");
    expect(m.text).toContain("completes today");
    expect(m.text).toContain("Friday, 20 November 2026");
    expect(m.text).toMatch(/\d+ \S+.* \d{4} AH/);
    expect(m.text).toContain("turn them off in Settings");
  });
});

describe("lead reminder subject", () => {
  const subject = (daysLeft: number) =>
    reminderEmailMessage({
      to: "a@b.c",
      name: "Yusuf",
      dueDay: "2026-11-20",
      due: { kind: "week", daysLeft },
      calendar: "tabular",
      link: "https://m.app/year",
    }).subject;

  it("counts the real days left", () => {
    expect(subject(7)).toBe("Your zakat year closes in 7 days");
    expect(subject(3)).toBe("Your zakat year closes in 3 days");
    expect(subject(1)).toBe("Your zakat year closes tomorrow");
  });
});
