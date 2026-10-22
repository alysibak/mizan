import { describe, expect, it } from "vitest";
import { BACKUP_KEYS } from "./my-zakat";
import { PHONE_KEYS, phoneDues, phoneLines, type PhoneContext } from "./phone-features";

const ctx: PhoneContext = {
  today: new Date(2026, 9, 20),
  money: (n) => `US$${n.toFixed(2)}`,
  decimal: ".",
  intl: "en-CA",
};
const reader = (store: Record<string, string>) => (key: string) => store[key] ?? null;

describe("the phone registry", () => {
  it("shows nothing for a phone that keeps nothing", () => {
    expect(phoneLines(reader({}), ctx)).toEqual([]);
    expect(phoneDues(reader({}), ctx)).toEqual({
      missedLeft: 0,
      interestToGive: 0,
      farmDue: false,
      fastsLeft: 0,
      fastsToGive: 0,
      repaymentsDue: 0,
    });
  });

  it("gives each tool that keeps something a line, in order, and what it owes", () => {
    const store = {
      "mizan-missed-v1": JSON.stringify({ years: "2", same: "10000", different: false, each: [], months: 1, given: "100" }),
      "mizan-interest-v1": JSON.stringify({ balance: "1000", interest: "20", given: false }),
      "mizan-family-v1": JSON.stringify({ members: [{}, {}, {}] }),
      "mizan-fitr-v1": JSON.stringify({ people: "4", perPerson: "10" }),
    };
    const lines = phoneLines(reader(store), ctx);
    expect(lines.map((l) => l.key)).toEqual(["missed", "interest", "family", "fitr"]);
    expect(lines[0]).toMatchObject({ title: "Past years", status: "US$400.00 still to give", href: "/missed-years" });
    expect(lines[1].status).toBe("US$20.00 to give away");
    expect(lines[2].status).toBe("3 people, each weighed on their own");
    expect(lines[3].status).toBe("US$40.00 for 4 people, before the Eid prayer");
    expect(phoneDues(reader(store), ctx)).toEqual({
      missedLeft: 400,
      interestToGive: 20,
      farmDue: false,
      fastsLeft: 0,
      fastsToGive: 0,
      repaymentsDue: 0,
    });
  });

  it("counts money lent and borrowed, and repayments coming up", () => {
    const store = {
      "mizan-debts-v1": JSON.stringify({
        notes: [
          { id: "a", kind: "lent", who: "Ali", amount: "500", paid: "100", due: "", made: "2026-10-01", status: "open" },
          { id: "b", kind: "borrowed", who: "Sara", amount: "80", paid: "", due: "2026-10-24", made: "2026-10-01", status: "open" },
        ],
      }),
    };
    expect(phoneLines(reader(store), ctx)[0]).toMatchObject({
      key: "debts",
      status: "US$400.00 owed to you · you owe US$80.00",
      href: "/debts",
    });
    expect(phoneDues(reader(store), ctx).repaymentsDue).toBe(1);
  });

  it("counts interest already given away as nothing owed", () => {
    const store = { "mizan-interest-v1": JSON.stringify({ balance: "1000", interest: "20", given: true }) };
    expect(phoneLines(reader(store), ctx)[0].status).toBe("US$20.00 given away");
    expect(phoneDues(reader(store), ctx).interestToGive).toBe(0);
  });

  it("counts missed fasts still to make up, and fidya still to give", () => {
    const store = {
      "mizan-fasts-v1": JSON.stringify({ owed: "10", madeUp: 3, fidyaDays: "5", perDay: "8", kaffarah: "1" }),
    };
    expect(phoneLines(reader(store), ctx)[0]).toMatchObject({
      key: "fasts",
      status: "7 fasts to make up · US$40.00 to give · 60 days of kaffarah",
      href: "/fasts",
    });
    expect(phoneDues(reader(store), ctx)).toMatchObject({ fastsLeft: 7, fastsToGive: 40 });
  });

  it("is saved and moved with everything else", () => {
    for (const key of PHONE_KEYS) expect(BACKUP_KEYS).toContain(key);
  });
});
