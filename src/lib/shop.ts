/**
 * Zakat on a small business: what is held for sale and the money it brings
 * in are counted; what the business uses to run (the building, shelves,
 * scales, a van) is not. One owner's shop and personal savings are counted
 * together, since the nisab is for the person.
 */
import { ZAKAT_RATE_LUNAR } from "@/lib/zakat";

export interface ShopFigures {
  /** Goods on the shelves and in storage, at what they would sell for today. */
  stock: number;
  /** In the till and the business bank account. */
  cash: number;
  /** What customers owe that you expect to be paid. */
  owedToYou: number;
  /** The owner's own savings outside the shop. */
  personal: number;
  /** What the shop owes suppliers, due now. */
  owedBySuppliers: number;
}

export interface ShopResult {
  counted: number;
  net: number;
  due: boolean;
  zakat: number;
}

export function shopZakat(f: ShopFigures, nisab: number): ShopResult {
  const n = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);
  const counted = n(f.stock) + n(f.cash) + n(f.owedToYou) + n(f.personal);
  const net = Math.max(0, counted - n(f.owedBySuppliers));
  const due = nisab > 0 && net >= nisab;
  return { counted, net, due, zakat: due ? Math.round(net * ZAKAT_RATE_LUNAR * 100) / 100 : 0 };
}
