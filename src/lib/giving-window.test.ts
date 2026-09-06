import { describe, expect, it } from "vitest";
import {
  dateInWindow,
  duePhase,
  metalsFreshness,
  metalsLookLikeDefaults,
  paymentWindow,
  sumZakatInWindow,
} from "./giving-window";

describe("paymentWindow", () => {
  it("uses Gregorian year when hawl is unset", () => {
    const w = paymentWindow(null, new Date("2026-06-15T12:00:00Z"));
    expect(w.kind).toBe("gregorian");
    expect(w.start).toBe("2026-01-01");
    expect(w.end).toBe("2026-12-31");
  });

  it("uses hawl cycle when start is set", () => {
    const w = paymentWindow("2025-03-01", new Date("2025-06-01T12:00:00Z"));
    expect(w.kind).toBe("hawl");
    expect(w.start).toBe("2025-03-01");
    expect(w.end >= w.start).toBe(true);
  });
});

describe("sumZakatInWindow", () => {
  it("counts only zakat inside the window", () => {
    const w = { start: "2026-01-01", end: "2026-12-31" };
    const total = sumZakatInWindow(
      [
        { type: "zakat", amount: 100, date: "2026-05-01" },
        { type: "sadaqah", amount: 50, date: "2026-05-01" },
        { type: "zakat", amount: 25, date: "2025-12-31" },
      ],
      w,
    );
    expect(total).toBe(100);
    expect(dateInWindow("2026-05-01", w)).toBe(true);
  });
});

describe("duePhase", () => {
  it("is indicative when above nisab but hawl incomplete", () => {
    expect(
      duePhase({
        meetsNisab: true,
        hawlStartDate: "2026-01-01",
        today: new Date("2026-02-01T12:00:00Z"),
      }),
    ).toBe("indicative");
  });

  it("is below_nisab when wealth is short", () => {
    expect(duePhase({ meetsNisab: false, hawlStartDate: "2020-01-01" })).toBe(
      "below_nisab",
    );
  });
});

describe("metalsLookLikeDefaults", () => {
  it("flags seed prices", () => {
    expect(metalsLookLikeDefaults(90, 1.05)).toBe(true);
    expect(metalsLookLikeDefaults(95, 1.05)).toBe(false);
  });
});

describe("metalsFreshness", () => {
  it("flags defaults even with a timestamp", () => {
    expect(
      metalsFreshness({
        gold: 90,
        silver: 1.05,
        metalsUpdatedAt: "2026-01-01T00:00:00.000Z",
        today: new Date("2026-01-02T00:00:00.000Z"),
      }),
    ).toEqual({ stale: true, reason: "defaults", ageDays: null });
  });

  it("flags never-confirmed custom prices", () => {
    expect(
      metalsFreshness({
        gold: 100,
        silver: 1.2,
        metalsUpdatedAt: null,
      }),
    ).toEqual({ stale: true, reason: "never", ageDays: null });
  });

  it("flags aged prices after 30 days", () => {
    expect(
      metalsFreshness({
        gold: 100,
        silver: 1.2,
        metalsUpdatedAt: "2026-01-01T00:00:00.000Z",
        today: new Date("2026-02-05T00:00:00.000Z"),
      }),
    ).toEqual({ stale: true, reason: "aged", ageDays: 35 });
  });

  it("is fresh within the window", () => {
    expect(
      metalsFreshness({
        gold: 100,
        silver: 1.2,
        metalsUpdatedAt: "2026-01-20T00:00:00.000Z",
        today: new Date("2026-02-05T00:00:00.000Z"),
      }),
    ).toEqual({ stale: false, reason: null, ageDays: 16 });
  });
});
