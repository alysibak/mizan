import { describe, it, expect } from "vitest";
import { addDays, isIsoDay, isoDay, localIsoDay } from "./dates";

describe("isIsoDay", () => {
  it("accepts real calendar days", () => {
    expect(isIsoDay("2024-02-29")).toBe(true);
    expect(isIsoDay("2025-12-31")).toBe(true);
  });
  it("rejects impossible days and other shapes", () => {
    expect(isIsoDay("2025-02-29")).toBe(false);
    expect(isIsoDay("2025-13-01")).toBe(false);
    expect(isIsoDay("2025-1-01")).toBe(false);
    expect(isIsoDay("2025-01-01T00:00:00Z")).toBe(false);
    expect(isIsoDay("garbage")).toBe(false);
    expect(isIsoDay("0001-01-01")).toBe(false);
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2025-01-31", 1)).toBe("2025-02-01");
    expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
    expect(addDays("2025-03-01", -1)).toBe("2025-02-28");
  });
});

describe("isoDay / localIsoDay", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(isoDay(new Date("2026-10-02T23:30:00Z"))).toBe("2026-10-02");
    expect(localIsoDay(new Date(2026, 0, 5, 23, 0))).toBe("2026-01-05");
  });
});
