import { describe, expect, it } from "vitest";
import {
  PLEDGE_HOLD_DAYS,
  canPublish,
  cleanText,
  daysLeft,
  isListed,
  needProgress,
  needState,
  pledgeHolds,
  privacyProblem,
  readMoney,
  readNeed,
  readNeighboursMode,
  readPledge,
  slugFor,
  sqlTime,
} from "./neighbours";

const now = new Date("2026-10-23T12:00:00Z");
const ago = (days: number) => sqlTime(new Date(now.getTime() - days * 86_400_000));

describe("neighbours is off unless turned on", () => {
  it("reads the setting", () => {
    expect(readNeighboursMode(undefined)).toBe("off");
    expect(readNeighboursMode("")).toBe("off");
    expect(readNeighboursMode("yes")).toBe("off");
    expect(readNeighboursMode(" ON ")).toBe("on");
    expect(readNeighboursMode("demo")).toBe("demo");
  });
});

describe("a need never points to the family", () => {
  it("refuses phone numbers, emails, links and handles", () => {
    expect(privacyProblem("Call 0300 1234567 for details")).toMatch(/phone/);
    expect(privacyProblem("call +44 (20) 7946-0958")).toMatch(/phone/);
    expect(privacyProblem("write to amina@example.com")).toMatch(/email/);
    expect(privacyProblem("see https://example.com/x")).toMatch(/link/);
    expect(privacyProblem("message @aminak")).toMatch(/social/);
  });

  it("lets plain amounts and words through", () => {
    expect(privacyProblem("Rent of 15,000 for a mother of three")).toBeNull();
    expect(privacyProblem("Two months of rent, 1,250,000 in all")).toBeNull();
    expect(privacyProblem("Medicine for an older man, 3 months")).toBeNull();
    expect(privacyProblem("Rent due 2026-11-01, or by 01/11/2026")).toBeNull();
    expect(privacyProblem("Loyer de 1.250.000 francs")).toBeNull();
  });

  it("is checked when a need is written", () => {
    const r = readNeed({ kind: "rent", title: "Rent for a family", story: "Call 07946 095800", amount: 500, zakat: true });
    expect(r).toEqual({ error: expect.stringMatching(/Nothing should point to the family/) });
  });
});

describe("writing a need", () => {
  it("takes what a mosque writes, tidied", () => {
    const r = readNeed({ kind: "food", title: "  Food for a\nfamily of five ", story: "", amount: "1,200", zakat: false, days: 14 });
    expect(r).toEqual({
      need: { kind: "food", title: "Food for a family of five", story: "", amount: 1200, zakat: false, days: 14 },
    });
  });

  it("asks for what is missing", () => {
    expect(readNeed({ kind: "car", title: "x", amount: 1, zakat: true })).toEqual({ error: "Choose what the need is for." });
    expect(readNeed({ kind: "rent", title: "ab", amount: 1, zakat: true })).toEqual({
      error: "Say in a few words what is needed.",
    });
    expect(readNeed({ kind: "rent", title: "Rent due", amount: 0, zakat: true })).toEqual({
      error: "Enter how much is needed.",
    });
    expect(readNeed({ kind: "rent", title: "Rent due", amount: 10 })).toEqual({
      error: "Say whether zakat can go to this need.",
    });
  });

  it("lists for 30 days unless one of the offered lengths is chosen", () => {
    const r = readNeed({ kind: "rent", title: "Rent due", amount: 10, zakat: true, days: 1000 });
    expect("need" in r && r.need.days).toBe(30);
  });
});

describe("money and text", () => {
  it("reads money as typed", () => {
    expect(readMoney("1,250.505")).toBe(1250.51);
    expect(readMoney(-5)).toBeNull();
    expect(readMoney("lots")).toBeNull();
    expect(readMoney(1e12)).toBeNull();
  });

  it("strips control characters and long runs of blank lines", () => {
    expect(cleanText("a\u0000b\n\n\n\nc", 10)).toBe("ab\n\nc");
  });
});

describe("pledges", () => {
  it("need a real need and an amount", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    expect(readPledge({ needId: id, amount: "50", name: " Amina ", contact: "" })).toEqual({
      pledge: { needId: id, amount: 50, name: "Amina", contact: "" },
    });
    expect(readPledge({ needId: "x", amount: 50 })).toEqual({ error: "That need was not found." });
    expect(readPledge({ needId: id, amount: 0 })).toEqual({ error: "Enter how much you will give." });
  });

  it("hold their place for a week, then lapse", () => {
    expect(pledgeHolds({ amount: 10, status: "pledged", createdAt: ago(1) }, now)).toBe(true);
    expect(pledgeHolds({ amount: 10, status: "pledged", createdAt: ago(PLEDGE_HOLD_DAYS + 0.1) }, now)).toBe(false);
    expect(pledgeHolds({ amount: 10, status: "received", createdAt: ago(1) }, now)).toBe(false);
  });
});

describe("a need's progress", () => {
  const need = { amount: 1000, received: 300, status: "open", paused: false, expiresAt: sqlTime(new Date(now.getTime() + 5 * 86_400_000)) };

  it("never lets more be promised than is needed", () => {
    const p = needProgress(need, [{ amount: 500, status: "pledged", createdAt: ago(1) }], now);
    expect(p).toMatchObject({ received: 300, pledged: 500, room: 200, share: 0.3, promisedShare: 0.8 });
    expect(needState(need, p, now)).toBe("open");
  });

  it("is in hand once fully promised, and opens again when a promise lapses", () => {
    const fresh = needProgress(need, [{ amount: 700, status: "pledged", createdAt: ago(1) }], now);
    expect(fresh.room).toBe(0);
    expect(needState(need, fresh, now)).toBe("covered");
    expect(isListed("covered")).toBe(true);
    const lapsed = needProgress(need, [{ amount: 700, status: "pledged", createdAt: ago(8) }], now);
    expect(needState(need, lapsed, now)).toBe("open");
  });

  it("is met when all of it has arrived", () => {
    const p = needProgress({ ...need, received: 1000 }, [], now);
    expect(needState({ ...need, received: 1000 }, p, now)).toBe("met");
    expect(isListed("met")).toBe(false);
  });

  it("ends when its time runs out, and is off the list while paused", () => {
    const ended = { ...need, expiresAt: ago(1) };
    expect(needState(ended, needProgress(ended, [], now), now)).toBe("ended");
    const paused = { ...need, paused: true };
    expect(needState(paused, needProgress(paused, [], now), now)).toBe("paused");
    expect(isListed("paused")).toBe(false);
  });

  it("counts whole days left", () => {
    expect(daysLeft(need.expiresAt, now)).toBe(5);
    expect(daysLeft(ago(1), now)).toBe(0);
    expect(daysLeft(null, now)).toBeNull();
  });
});

describe("the two-person check", () => {
  it("needs a second person to list a need", () => {
    expect(canPublish({ twoPerson: true, members: 1, createdBy: "a", userId: "a" })).toMatchObject({ ok: false });
    expect(canPublish({ twoPerson: true, members: 2, createdBy: "a", userId: "a" })).toMatchObject({ ok: false });
    expect(canPublish({ twoPerson: true, members: 2, createdBy: "a", userId: "b" })).toEqual({ ok: true });
    expect(canPublish({ twoPerson: false, members: 1, createdBy: "a", userId: "a" })).toEqual({ ok: true });
  });
});

describe("a mosque's web address", () => {
  it("comes from its name", () => {
    expect(slugFor("Masjid Al-Noor, Leeds")).toBe("masjid-al-noor-leeds");
    expect(slugFor("Mosquée de Paris")).toBe("mosquee-de-paris");
    expect(slugFor("مسجد")).toBe("mosque");
  });
});
