import { describe, expect, it } from "vitest";
import {
  closedThroughFromFreezes,
  dateInWindow,
  duePhase,
  freezeCoversWindow,
  outstandingZakat,
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

describe("cycle accounting across a roll", () => {
  // Hawl from 2024-10-01 falls due in late September 2025. Zakat for it is
  // paid on 2025-10-01 (after the due day), the year is frozen on
  // 2025-10-02, and the hawl is rolled to the due day.
  const firstStart = "2024-10-01";
  const today = new Date("2025-10-02T12:00:00Z");
  const due = paymentWindow(firstStart, today).detail.match(/due day (\d{4}-\d{2}-\d{2})/)![1];
  const payment = { type: "zakat", amount: 400, date: "2025-10-01" };
  const freeze = {
    takenAt: "2025-10-02",
    windowKind: "hawl" as const,
    cycleStart: firstStart,
    windowStart: firstStart,
    windowEnd: "2025-10-02",
  };

  it("counts the late payment toward the cycle it was for", () => {
    const w = paymentWindow(firstStart, today);
    expect(sumZakatInWindow([payment], w)).toBe(400);
    expect(freezeCoversWindow(freeze, w)).toBe(true);
  });

  it("does not count it again toward the next cycle", () => {
    const closed = closedThroughFromFreezes([freeze], due);
    expect(closed).toBe("2025-10-02");
    const next = paymentWindow(due, today, closed);
    expect(next.cycleStart).toBe(due);
    expect(next.start).toBe("2025-10-03");
    expect(sumZakatInWindow([payment], next)).toBe(0);
    expect(sumZakatInWindow([{ ...payment, date: "2025-11-01" }], next)).toBe(400);
  });

  it("knows the old freeze does not cover the new cycle", () => {
    const next = paymentWindow(due, today, closedThroughFromFreezes([freeze], due));
    expect(freezeCoversWindow(freeze, next)).toBe(false);
  });

  it("ignores freezes from the current or a later cycle", () => {
    expect(closedThroughFromFreezes([freeze], firstStart)).toBeNull();
    expect(closedThroughFromFreezes([freeze], "2023-01-01")).toBeNull();
    expect(closedThroughFromFreezes([freeze], null)).toBeNull();
  });

  it("falls back to the freeze date for freezes that predate windows", () => {
    const w = paymentWindow(firstStart, today);
    expect(freezeCoversWindow({ takenAt: "2025-06-01" }, w)).toBe(true);
    expect(freezeCoversWindow({ takenAt: "2023-06-01" }, w)).toBe(false);
  });
});

describe("outstandingZakat", () => {
  it("rounds to the cent so paying the shown figure clears the cycle", () => {
    expect(outstandingZakat(308.64175, 0)).toBe(308.64);
    expect(outstandingZakat(308.64175, 308.64)).toBe(0);
    expect(outstandingZakat(412.43, 100)).toBe(312.43);
  });

  it("never goes negative", () => {
    expect(outstandingZakat(400, 500)).toBe(0);
  });
});

describe("starter metal prices", () => {
  it("claim nothing is due or payable", () => {
    expect(
      duePhase({ meetsNisab: true, hawlStartDate: "2020-01-01", pricesUnverified: true }),
    ).toBe("unverified");
    expect(duePhase({ meetsNisab: false, hawlStartDate: null, pricesUnverified: true })).toBe(
      "unverified",
    );
  });
});
