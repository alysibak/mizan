import { describe, expect, it } from "vitest";
import {
  REMINDER_LEAD_DAYS,
  reminderEmailMessage,
  reminderKey,
  reminderKind,
  resetEmailMessage,
  verifyEmailMessage,
} from "./email-content";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("reminderKind", () => {
  it("is quiet until a week before the hawl day", () => {
    expect(reminderKind("2026-11-20", day("2026-11-01"))).toBeNull();
    expect(reminderKind("2026-11-20", day("2026-11-12"))).toBeNull();
  });

  it("sends the week-ahead reminder in the last seven days", () => {
    expect(REMINDER_LEAD_DAYS).toBe(7);
    expect(reminderKind("2026-11-20", day("2026-11-13"))).toBe("week");
    expect(reminderKind("2026-11-20", day("2026-11-19"))).toBe("week");
  });

  it("sends the day-of reminder on the day, or late if a run was missed", () => {
    expect(reminderKind("2026-11-20", day("2026-11-20"))).toBe("day");
    expect(reminderKind("2026-11-20", day("2026-11-23"))).toBe("day");
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
        kind: "week",
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
      kind: "day",
      calendar: "tabular",
      link: "https://m.app/year",
    });
    expect(m.subject).toBe("Your zakat year is complete");
    expect(m.text).toContain("Friday, 20 November 2026");
    expect(m.text).toMatch(/\d+ \S+.* \d{4} AH/);
    expect(m.text).toContain("turn them off in Settings");
  });
});
