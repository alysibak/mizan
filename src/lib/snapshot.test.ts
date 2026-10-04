import { describe, it, expect } from "vitest";
import { parseSnapshotPayload } from "./snapshot";

const legacy = {
  version: 1,
  settings: {
    currency: "CAD",
    nisabStandard: "silver",
    calendarBasis: "lunar",
    goldPricePerGram: 90,
    silverPricePerGram: 1.05,
    hawlStartDate: "2025-01-01",
  },
  assets: [{ category: "cash", label: "Cash", amount: 1000, zakatablePortion: 1 }],
  liabilities: [],
  result: {
    grossZakatable: 1000,
    deductibleLiabilities: 0,
    netZakatable: 1000,
    nisab: 624.75,
    goldNisab: 7650,
    silverNisab: 624.75,
    rate: 0.025,
    basis: "lunar",
    zakatDue: 25,
    isDue: true,
    marginToNisab: 375.25,
  },
  givingYtd: { year: 2025, zakat: 25, sadaqah: 0, purification: 0 },
};

describe("parseSnapshotPayload", () => {
  it("reads freezes made before windows were recorded", () => {
    expect(parseSnapshotPayload(JSON.stringify(legacy))?.result.zakatDue).toBe(25);
  });

  it("rejects payloads that would break the snapshot page", () => {
    expect(parseSnapshotPayload("not json")).toBeNull();
    expect(parseSnapshotPayload(JSON.stringify({ version: 1, result: {} }))).toBeNull();
    expect(
      parseSnapshotPayload(JSON.stringify({ ...legacy, assets: "lots" })),
    ).toBeNull();
  });
});
