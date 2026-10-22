import { describe, expect, it } from "vitest";
import {
  debtTotals,
  dueState,
  leftOn,
  newNote,
  noteText,
  parseDebts,
  payPart,
  repaymentsDue,
  serializeDebts,
} from "./debts";

const today = new Date(2026, 9, 22);
const lent = newNote({ kind: "lent", who: "Uncle Ahmed", amount: "5000", due: "2026-12-01" }, today, "a");
const borrowed = newNote({ kind: "borrowed", who: "Sara", amount: "300", due: "2026-10-25" }, today, "b");

describe("money lent and borrowed", () => {
  it("writes a note down today, open", () => {
    expect(lent).toMatchObject({ kind: "lent", who: "Uncle Ahmed", made: "2026-10-22", status: "open", paid: "" });
  });

  it("keeps notes through storage, and drops what cannot be read", () => {
    const raw = serializeDebts([lent, borrowed]);
    expect(parseDebts(raw)).toEqual([lent, borrowed]);
    expect(parseDebts("not json")).toEqual([]);
    expect(parseDebts(JSON.stringify({ notes: [{ id: "x", amount: "0" }, { id: "y", amount: "10", due: "soon" }] }))).toEqual([
      expect.objectContaining({ id: "y", due: "", kind: "lent", status: "open" }),
    ]);
  });

  it("counts what is owed each way, part payments taken off", () => {
    const part = payPart(lent, 1500);
    expect(leftOn(part)).toBe(3500);
    expect(debtTotals([part, borrowed])).toEqual({ owedToYou: 3500, owedToYouCount: 1, youOwe: 300, youOweCount: 1 });
  });

  it("settles a note once it is all paid back, and a forgiven one owes nothing", () => {
    expect(payPart(borrowed, 300).status).toBe("paid");
    expect(leftOn({ ...lent, status: "forgiven" })).toBe(0);
    expect(debtTotals([{ ...lent, status: "forgiven" }]).owedToYou).toBe(0);
  });

  it("says when a repayment is late or due within a week", () => {
    expect(dueState(borrowed, today)).toBe("soon");
    expect(dueState(borrowed, new Date(2026, 9, 26))).toBe("late");
    expect(dueState(lent, today)).toBeNull();
    expect(dueState(payPart(borrowed, 300), new Date(2026, 9, 26))).toBeNull();
    expect(repaymentsDue([lent, borrowed], today)).toBe(1);
  });

  it("words the note so both people can read it", () => {
    const money = (n: number) => `PKR ${n.toLocaleString("en")}`;
    expect(noteText(payPart(lent, 1000), money)).toBe(
      "I lent Uncle Ahmed PKR 5,000 on 2026-10-22. To be paid back by 2026-12-01. Paid back so far: PKR 1,000. Written down so neither of us forgets (Quran 2:282).",
    );
    expect(noteText({ ...borrowed, who: "", due: "" }, money)).toBe(
      "I borrowed PKR 300 from someone on 2026-10-22. Written down so neither of us forgets (Quran 2:282).",
    );
  });
});
