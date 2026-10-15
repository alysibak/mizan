import { describe, expect, it } from "vitest";
import { shopZakat } from "./shop";

describe("shopZakat", () => {
  it("counts stock, cash, money owed to the shop, and savings, less what is owed to suppliers", () => {
    const r = shopZakat({ stock: 300_000, cash: 50_000, owedToYou: 20_000, personal: 30_000, owedBySuppliers: 100_000 }, 150_000);
    expect(r.counted).toBe(400_000);
    expect(r.net).toBe(300_000);
    expect(r.due).toBe(true);
    expect(r.zakat).toBe(7_500);
  });

  it("owes nothing below the nisab or while it is unknown", () => {
    expect(shopZakat({ stock: 100, cash: 0, owedToYou: 0, personal: 0, owedBySuppliers: 0 }, 150_000).due).toBe(false);
    expect(shopZakat({ stock: 1e6, cash: 0, owedToYou: 0, personal: 0, owedBySuppliers: 0 }, 0).due).toBe(false);
  });

  it("never goes below zero when debts are larger", () => {
    expect(shopZakat({ stock: 10, cash: 0, owedToYou: 0, personal: 0, owedBySuppliers: 500 }, 1).net).toBe(0);
  });
});
