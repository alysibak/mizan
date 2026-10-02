import { describe, it, expect } from "vitest";
import {
  assetSchema,
  givingSchema,
  liabilitySchema,
  registerSchema,
  settingsSchema,
} from "./validation";

const asset = { category: "cash", label: "Wallet", amount: "100" };

describe("assetSchema", () => {
  it("coerces form strings and normalises blanks to null", () => {
    const r = assetSchema.parse({ ...asset, hawlStartDate: "", note: "  " });
    expect(r.amount).toBe(100);
    expect(r.zakatablePortion).toBe(1);
    expect(r.hawlStartDate).toBeNull();
    expect(r.note).toBeNull();
  });

  it("rejects an empty amount instead of reading it as zero", () => {
    expect(assetSchema.safeParse({ ...asset, amount: "" }).success).toBe(false);
  });

  it("rejects infinite, negative, and absurd amounts", () => {
    expect(assetSchema.safeParse({ ...asset, amount: "Infinity" }).success).toBe(false);
    expect(assetSchema.safeParse({ ...asset, amount: 1e400 }).success).toBe(false);
    expect(assetSchema.safeParse({ ...asset, amount: -1 }).success).toBe(false);
    expect(assetSchema.safeParse({ ...asset, amount: 1e13 }).success).toBe(false);
  });

  it("rejects impossible hawl dates", () => {
    expect(assetSchema.safeParse({ ...asset, hawlStartDate: "garbage" }).success).toBe(false);
    expect(assetSchema.safeParse({ ...asset, hawlStartDate: "2025-02-30" }).success).toBe(false);
    expect(assetSchema.parse({ ...asset, hawlStartDate: "2025-02-28" }).hawlStartDate).toBe(
      "2025-02-28",
    );
  });

  it("leaves omitted fields out of a partial update", () => {
    const r = assetSchema.partial().parse({ amount: 5 });
    expect(r).toEqual({ amount: 5 });
  });
});

describe("liabilitySchema", () => {
  it("reads the string 'false' as false", () => {
    expect(liabilitySchema.parse({ label: "Card", amount: 1, deductible: "false" }).deductible).toBe(
      false,
    );
    expect(liabilitySchema.parse({ label: "Card", amount: 1, deductible: "on" }).deductible).toBe(true);
    expect(liabilitySchema.parse({ label: "Card", amount: 1 }).deductible).toBe(true);
  });
});

describe("givingSchema", () => {
  it("requires a real date and a positive amount", () => {
    expect(givingSchema.safeParse({ amount: 10, date: "garbage" }).success).toBe(false);
    expect(givingSchema.safeParse({ amount: 0, date: "2026-01-01" }).success).toBe(false);
    expect(givingSchema.parse({ amount: "10.5", date: "2026-01-01" }).type).toBe("sadaqah");
  });

  it("accepts Zakat al-Fitr", () => {
    expect(givingSchema.parse({ amount: 15, type: "fitr", date: "2026-03-30" }).type).toBe("fitr");
  });
});

describe("settingsSchema", () => {
  const base = {
    currency: "cad",
    nisabStandard: "silver",
    calendarBasis: "lunar",
    goldPricePerGram: "120",
    silverPricePerGram: "1.5",
  };

  it("upper-cases a valid currency and rejects malformed ones", () => {
    expect(settingsSchema.parse(base).currency).toBe("CAD");
    expect(settingsSchema.safeParse({ ...base, currency: "12$" }).success).toBe(false);
  });

  it("keeps an omitted trust timestamp undefined so saves do not clear it", () => {
    expect(settingsSchema.parse(base).trustedAckAt).toBeUndefined();
    expect(settingsSchema.parse({ ...base, trustedAckAt: null }).trustedAckAt).toBeNull();
    expect(settingsSchema.safeParse({ ...base, trustedAckAt: "yesterday" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("bounds passwords to what bcrypt reads", () => {
    const ok = { name: "A", email: "a@example.com", password: "x".repeat(72) };
    expect(registerSchema.safeParse(ok).success).toBe(true);
    expect(registerSchema.safeParse({ ...ok, password: "x".repeat(73) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, password: "short" }).success).toBe(false);
  });
});

describe("money is kept to the cent", () => {
  it("rounds amounts as they are saved", () => {
    expect(assetSchema.parse({ category: "cash", label: "x", amount: "10.005" }).amount).toBe(10.01);
    expect(givingSchema.parse({ amount: 0.004 + 0.002, date: "2026-01-01" }).amount).toBe(0.01);
  });

  it("refuses a gift that rounds to nothing", () => {
    expect(givingSchema.safeParse({ amount: 0.001, date: "2026-01-01" }).success).toBe(false);
  });
});
