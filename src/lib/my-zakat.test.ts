import { describe, expect, it } from "vitest";
import {
  EMPTY_MY,
  addPayment,
  backupFile,
  closeYear,
  daysUntil,
  nextZakatDay,
  parseMy,
  paymentsTotal,
  readBackup,
  removePayment,
  todos,
  zakatDays,
  type Snapshot,
} from "./my-zakat";

const today = new Date(2026, 9, 20); // 20 October 2026

describe("parseMy", () => {
  it("gives an empty year for nothing or nonsense", () => {
    expect(parseMy(null)).toEqual(EMPTY_MY);
    expect(parseMy("{oops")).toEqual(EMPTY_MY);
  });

  it("keeps only well-formed pieces", () => {
    const my = parseMy(
      JSON.stringify({
        zakatDay: { month: 9, day: 1 },
        payments: [
          { id: "a", day: "2026-10-01", amount: 50, to: "My brother" },
          { id: "b", day: "not a day", amount: 10 },
          { id: "c", day: "2026-10-02", amount: -5 },
        ],
        history: [{ hijriYear: 1447, currency: "GBP", due: 100, given: 100, closed: "2026-02-20" }],
      }),
    );
    expect(my.zakatDay).toEqual({ month: 9, day: 1 });
    expect(my.payments.map((p) => p.id)).toEqual(["a"]);
    expect(my.history).toHaveLength(1);
  });

  it("rejects a zakat day that is not in every month", () => {
    expect(parseMy(JSON.stringify({ zakatDay: { month: 9, day: 30 } })).zakatDay).toBeNull();
    expect(parseMy(JSON.stringify({ zakatDay: { month: 13, day: 1 } })).zakatDay).toBeNull();
  });
});

describe("the zakat day", () => {
  it("comes round next on 1 Ramadan 1448", () => {
    const next = nextZakatDay({ month: 9, day: 1 }, today);
    expect(next.toISOString().slice(0, 10)).toBe("2027-02-08");
    expect(daysUntil(next, today)).toBe(111);
  });

  it("is today when today is the day", () => {
    const next = nextZakatDay({ month: 9, day: 1 }, new Date(2027, 1, 8));
    expect(daysUntil(next, new Date(2027, 1, 8))).toBe(0);
  });

  it("gives one date a year for reminders, about 354 days apart", () => {
    const days = zakatDays({ month: 9, day: 1 }, today, 3);
    expect(days).toHaveLength(3);
    const gap = (days[1].getTime() - days[0].getTime()) / 86_400_000;
    expect(gap).toBeGreaterThanOrEqual(354);
    expect(gap).toBeLessThanOrEqual(355);
  });
});

describe("payments and the record", () => {
  it("adds, totals, and removes payments", () => {
    let my = addPayment(EMPTY_MY, { day: "2026-10-01", amount: 100.004, to: "" }, 1);
    my = addPayment(my, { day: "2026-10-02", amount: 50, to: "Masjid" }, 2);
    expect(paymentsTotal(my.payments)).toBe(150);
    my = removePayment(my, my.payments[0].id);
    expect(paymentsTotal(my.payments)).toBe(50);
  });

  it("closes a year into the record and starts the next one empty", () => {
    const my = addPayment(EMPTY_MY, { day: "2026-10-01", amount: 100, to: "" }, 1);
    const closed = closeYear(my, { hijriYear: 1448, currency: "PKR", due: 100, given: 100 }, today);
    expect(closed.payments).toEqual([]);
    expect(closed.history).toEqual([
      { hijriYear: 1448, currency: "PKR", due: 100, given: 100, closed: "2026-10-20" },
    ]);
    // Closing the same year again replaces it rather than adding a second.
    expect(closeYear(closed, { hijriYear: 1448, currency: "PKR", due: 120, given: 120 }, today).history).toHaveLength(1);
  });
});

describe("todos", () => {
  const base: Snapshot = {
    zakatDay: null,
    zakat: null,
    missedLeft: 0,
    interestToGive: 0,
    farmDue: false,
    ramadanIn: 111,
  };

  it("starts a newcomer with working it out and choosing a day", () => {
    expect(todos(base, today).map((t) => t.key)).toEqual(["work", "day"]);
  });

  it("sends someone signed in to their ledger instead of starting again", () => {
    expect(todos({ ...base, signedIn: true }, today).map((t) => t.key)).toEqual(["ledger", "day"]);
  });

  it("puts a near zakat day first, then what is left to give", () => {
    const keys = todos(
      { ...base, zakatDay: { month: 9, day: 1 }, zakat: { due: 500, given: 200, pricesAgeDays: 1 } },
      new Date(2027, 1, 1),
    ).map((t) => t.key);
    expect(keys[0]).toBe("soon");
    expect(keys).toContain("give");
  });

  it("on a monthly plan, asks for this month’s share, and nothing once it is given", () => {
    const zakat = { due: 500, given: 125, pricesAgeDays: 1 };
    const now = todos({ ...base, zakatDay: { month: 9, day: 1 }, zakat: { ...zakat, plan: "now" } }, today);
    expect(now.find((t) => t.key === "give")?.text).toBe("Give this month’s share of your zakat");
    const later = todos({ ...base, zakatDay: { month: 9, day: 1 }, zakat: { ...zakat, plan: "later" } }, today);
    expect(later.map((t) => t.key)).not.toContain("give");
  });

  it("asks for fresh prices when they are old, and for interest to be given away", () => {
    const keys = todos(
      { ...base, zakatDay: { month: 9, day: 1 }, zakat: { due: 500, given: 500, pricesAgeDays: 30 }, interestToGive: 12 },
      today,
    ).map((t) => t.key);
    expect(keys).toEqual(["prices", "interest"]);
  });

  it("asks for missed fasts to be made up, first when Ramadan is close", () => {
    expect(todos({ ...base, fastsLeft: 3 }, today).find((t) => t.key === "fasts")).toMatchObject({
      text: "Make up 3 missed fasts before Ramadan",
      rank: 6,
    });
    // Close to Ramadan, straight after working out the zakat.
    expect(todos({ ...base, fastsLeft: 1, ramadanIn: 20 }, today).map((t) => t.key)).toEqual(["work", "fasts", "day", "ramadan"]);
    expect(todos({ ...base, fastsToGive: 40 }, today).find((t) => t.key === "fasts")?.text).toBe(
      "Give the fidya for fasts you cannot make up",
    );
  });

  it("reminds about Zakat al-Fitr during Ramadan", () => {
    expect(todos({ ...base, ramadanIn: 0 }, today).map((t) => t.key)).toContain("fitr");
  });
});

describe("backup", () => {
  it("saves Mizan's keys and reads back only those", () => {
    const store: Record<string, string> = { "mizan-my-v1": "{}", "mizan-missed-v1": "{\"years\":\"2\"}", other: "x" };
    const file = backupFile((k) => store[k] ?? null, today);
    const back = readBackup(file);
    expect(back).toEqual({ "mizan-my-v1": "{}", "mizan-missed-v1": "{\"years\":\"2\"}" });
    expect(readBackup("not json")).toBeNull();
    expect(readBackup(JSON.stringify({ mizan: 1, data: { evil: "x" } }))).toBeNull();
  });
});

describe("draftAmount", () => {
  it("writes a total so it reads back the same with either decimal mark", async () => {
    const { draftAmount } = await import("./my-zakat");
    const { parseAmount } = await import("./calculator");
    expect(parseAmount(draftAmount(1500.5, ","), ",")).toBe(1500.5);
    expect(parseAmount(draftAmount(1500.5, "."), ".")).toBe(1500.5);
    expect(draftAmount(0.1 + 0.2, null)).toBe("0.3");
  });
});

describe("lastZakatDay", () => {
  it("is the zakat day this year began on", async () => {
    const { lastZakatDay } = await import("./my-zakat");
    expect(lastZakatDay({ month: 9, day: 1 }, today).toISOString().slice(0, 10)).toBe("2026-02-18");
    expect(lastZakatDay({ month: 9, day: 1 }, new Date(2027, 1, 8)).toISOString().slice(0, 10)).toBe("2027-02-08");
  });
});

describe("monthlyPlan", () => {
  it("spreads what is left over the months before the zakat day, in whole units", async () => {
    const { monthlyPlan } = await import("./my-zakat");
    const due = nextZakatDay({ month: 9, day: 1 }, today); // 8 February 2027
    expect(monthlyPlan(500, due, today)).toEqual([
      { day: "2026-10-20", amount: 125 },
      { day: "2026-11-20", amount: 125 },
      { day: "2026-12-20", amount: 125 },
      { day: "2027-01-20", amount: 125 },
    ]);
    const odd = monthlyPlan(437.5, due, today);
    expect(odd.map((p) => p.amount)).toEqual([110, 110, 110, 107.5]);
  });

  it("uses fewer months for a small amount, and none when the day is close", async () => {
    const { monthlyPlan } = await import("./my-zakat");
    const due = nextZakatDay({ month: 9, day: 1 }, today);
    expect(monthlyPlan(3, due, today).map((p) => p.amount)).toEqual([1, 1, 1]);
    expect(monthlyPlan(1, due, today)).toEqual([]);
    expect(monthlyPlan(500, due, new Date(2027, 0, 20))).toEqual([]);
  });

  it("starts next month once this month’s share is given", async () => {
    const { monthlyPlan } = await import("./my-zakat");
    const due = nextZakatDay({ month: 9, day: 1 }, today);
    expect(monthlyPlan(375, due, today, true)).toEqual([
      { day: "2026-11-20", amount: 125 },
      { day: "2026-12-20", amount: 125 },
      { day: "2027-01-20", amount: 125 },
    ]);
  });

  it("keeps to a date every month has", async () => {
    const { monthlyPlan } = await import("./my-zakat");
    const plan = monthlyPlan(300, new Date(Date.UTC(2027, 3, 1)), new Date(2027, 0, 31));
    expect(plan.map((p) => p.day)).toEqual(["2027-01-31", "2027-02-28", "2027-03-28"]);
  });
});

describe("overdueDays", () => {
  it("counts the days since a zakat day that is not closed, for two months", async () => {
    const { overdueDays } = await import("./my-zakat");
    const my = { ...EMPTY_MY, zakatDay: { month: 9, day: 1 } };
    // 1 Ramadan 1448 is 8 February 2027.
    expect(overdueDays(my, new Date(2027, 1, 18))).toBe(10);
    expect(overdueDays(my, new Date(2027, 1, 8))).toBe(0);
    expect(overdueDays(my, new Date(2027, 5, 1))).toBeNull();
    expect(overdueDays({ ...EMPTY_MY }, new Date(2027, 1, 18))).toBeNull();
    const closed = { ...my, history: [{ hijriYear: 1448, currency: "USD", due: 1, given: 1, closed: "2027-02-10" }] };
    expect(overdueDays(closed, new Date(2027, 1, 18))).toBeNull();
  });

  it("asks for what is left at once when the day has passed", () => {
    const list = todos(
      {
        zakatDay: { month: 9, day: 1 },
        zakat: { due: 500, given: 0, pricesAgeDays: 1 },
        missedLeft: 0,
        interestToGive: 0,
        farmDue: false,
        ramadanIn: 100,
        overdueDays: 10,
      },
      new Date(2027, 1, 18),
    );
    expect(list[0]).toMatchObject({ key: "give", text: "Your zakat day was 10 days ago: give what is left now" });
  });
});

describe("zakatDayOf and comingZakatDay", () => {
  it("makes today a zakat day, and the next one comes a Hijri year later", async () => {
    const { zakatDayOf, comingZakatDay } = await import("./my-zakat");
    const zd = zakatDayOf(today); // 9 Jumada I 1448
    expect(zd).toEqual({ month: 5, day: 9 });
    const next = comingZakatDay(zd, today);
    const gap = daysUntil(next, today);
    expect(gap).toBeGreaterThanOrEqual(354);
    expect(gap).toBeLessThanOrEqual(355);
    // A zakat day still ahead is simply the next one.
    expect(comingZakatDay({ month: 9, day: 1 }, today).toISOString().slice(0, 10)).toBe("2027-02-08");
  });
});

describe("summaryText", () => {
  it("puts this year's zakat in words to send, line by line", async () => {
    const { summaryText } = await import("./my-zakat");
    const text = summaryText({
      money: (n) => `US$${n.toFixed(2)}`,
      hijriYear: 1448,
      zakatDay: "1 Ramadan (8 February 2027)",
      isDue: true,
      zakat: 500,
      net: 20000,
      nisab: 714,
      given: 125,
      lines: [{ label: "Cash in hand", amount: 20500 }],
      debts: 500,
      link: "https://mizan.app/my",
    });
    expect(text.split("\n")).toEqual([
      "My zakat for 1448 AH",
      "Zakat day: 1 Ramadan (8 February 2027)",
      "Zakat: US$500.00 (2.5% of US$20000.00, above the nisab of US$714.00)",
      "Given: US$125.00 · Left: US$375.00",
      "",
      "What I counted:",
      "- Cash in hand: US$20500.00",
      "- Debts due now: −US$500.00",
      "",
      "Worked out with Mizan: https://mizan.app/my",
    ]);
  });
});
