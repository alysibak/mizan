import { describe, it, expect } from "vitest";
import { isValidTimeZone, userTodayIso } from "./today";

describe("userToday", () => {
  const lateEvening = new Date("2026-10-03T01:30:00Z"); // 9:30 pm in Toronto

  it("uses the user's own calendar day", () => {
    expect(userTodayIso("America/Toronto", lateEvening)).toBe("2026-10-02");
    expect(userTodayIso("Asia/Kuala_Lumpur", lateEvening)).toBe("2026-10-03");
  });

  it("falls back to UTC for a missing or bogus zone", () => {
    expect(userTodayIso(null, lateEvening)).toBe("2026-10-03");
    expect(userTodayIso("Mars/Olympus", lateEvening)).toBe("2026-10-03");
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});
