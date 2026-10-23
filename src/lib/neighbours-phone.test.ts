import { describe, expect, it } from "vitest";
import { forgetPledge, keepPledge, markNoted, parsePledges, writePledges, type KeptPledge } from "./neighbours-phone";

const one: KeptPledge = {
  code: "K7P4QX2M",
  needId: "123e4567-e89b-42d3-a456-426614174000",
  title: "Rent for a family",
  partner: "Masjid Al-Noor",
  amount: 50,
  currency: "CAD",
  zakat: true,
  day: "2026-10-23",
  noted: false,
};

describe("promises kept on the phone", () => {
  it("are read back as written", () => {
    expect(parsePledges(writePledges([one]))).toEqual([one]);
  });

  it("drop anything unreadable", () => {
    expect(parsePledges(null)).toEqual([]);
    expect(parsePledges("not json")).toEqual([]);
    expect(parsePledges(JSON.stringify({ pledges: [{ code: "bad" }, 3, null] }))).toEqual([]);
    const odd = parsePledges(JSON.stringify({ pledges: [{ ...one, amount: -4, currency: "x", day: "soon" }] }));
    expect(odd[0]).toMatchObject({ amount: 0, currency: "USD", day: "" });
  });

  it("are kept once each, noted once, and can be forgotten", () => {
    const twice = keepPledge(keepPledge([], one), { ...one, amount: 60 });
    expect(twice).toEqual([{ ...one, amount: 60 }]);
    expect(markNoted(twice, one.code)[0].noted).toBe(true);
    expect(forgetPledge(twice, one.code)).toEqual([]);
  });
});
