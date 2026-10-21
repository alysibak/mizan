import { describe, expect, it } from "vitest";
import { EMPTY_FASTS, count, fastsKept, fastsOwed, parseFasts } from "./fasts";

describe("parseFasts", () => {
  it("gives an empty record for nothing or nonsense", () => {
    expect(parseFasts(null)).toEqual(EMPTY_FASTS);
    expect(parseFasts("{oops")).toEqual(EMPTY_FASTS);
    expect(parseFasts(JSON.stringify({ madeUp: -3, owed: 7 })).madeUp).toBe(0);
  });

  it("keeps what was typed and ticked", () => {
    const s = parseFasts(JSON.stringify({ owed: "10", madeUp: 4, perDay: "8", fidyaGiven: true }));
    expect(s).toMatchObject({ owed: "10", madeUp: 4, perDay: "8", fidyaGiven: true, kaffarahDone: false });
  });
});

describe("count", () => {
  it("reads whole days only", () => {
    expect(count("12")).toBe(12);
    expect(count(" 3 ")).toBe(3);
    expect(count("2.5")).toBe(0);
    expect(count("-1")).toBe(0);
    expect(count("")).toBe(0);
  });
});

describe("fastsOwed", () => {
  it("counts the days left and what is given instead", () => {
    const s = { ...EMPTY_FASTS, owed: "10", madeUp: 4, fidyaDays: "30", kaffarah: "1", oaths: "2" };
    expect(fastsOwed(s, 8)).toEqual({
      left: 6,
      fidya: 240,
      kaffarahDays: 60,
      kaffarahFood: 480,
      oathFood: 160,
      oathDays: 6,
      toGive: 400,
    });
  });

  it("leaves out what is marked given, and never owes less than nothing", () => {
    const s = { ...EMPTY_FASTS, owed: "3", madeUp: 5, fidyaDays: "30", fidyaGiven: true, oaths: "1", oathsDone: true };
    const owed = fastsOwed(s, 8);
    expect(owed.left).toBe(0);
    expect(owed.toGive).toBe(0);
  });

  it("asks nothing in money until a price is given", () => {
    expect(fastsOwed({ ...EMPTY_FASTS, fidyaDays: "30" }, 0).fidya).toBe(0);
  });

  it("knows when nothing is kept", () => {
    expect(fastsKept(EMPTY_FASTS)).toBe(false);
    expect(fastsKept({ ...EMPTY_FASTS, oaths: "1" })).toBe(true);
  });
});
