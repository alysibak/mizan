// Asset categories and their zakat treatment.
//
// These defaults reflect mainstream positions across the major schools, but
// scholars differ on several points (especially long-term equities, pensions,
// and the treatment of debt). Mizan is an estimation aid, not a fatwa. The notes
// here are meant to make the reasoning visible, not to settle differences.

export type CategoryKey =
  | "cash"
  | "bank"
  | "gold"
  | "silver"
  | "stocks_trading"
  | "stocks_longterm"
  | "crypto"
  | "business_inventory"
  | "receivables"
  | "pension"
  | "other";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  group: "liquid" | "metals" | "investments" | "business" | "other";
  /** Default fraction of value that is zakatable (0..1). */
  defaultZakatablePortion: number;
  /** Whether the user is allowed to edit the zakatable portion in the UI. */
  portionEditable: boolean;
  note: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  cash: {
    key: "cash",
    label: "Cash on hand",
    group: "liquid",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Physical cash is fully zakatable at market value.",
  },
  bank: {
    key: "bank",
    label: "Bank balances",
    group: "liquid",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Chequing and savings balances are fully zakatable. Interest earned is not yours to keep and should be given away separately, not counted as growth.",
  },
  gold: {
    key: "gold",
    label: "Gold",
    group: "metals",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Investment gold is zakatable on its full market value. Jewellery in regular personal use is treated differently across schools; enter only what you intend to count.",
  },
  silver: {
    key: "silver",
    label: "Silver",
    group: "metals",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Investment silver is zakatable on its full market value.",
  },
  stocks_trading: {
    key: "stocks_trading",
    label: "Stocks (held for trading)",
    group: "investments",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Shares bought to resell are trade goods: zakatable on full current market value.",
  },
  stocks_longterm: {
    key: "stocks_longterm",
    label: "Stocks (long-term)",
    group: "investments",
    defaultZakatablePortion: 0.25,
    portionEditable: true,
    note: "For shares held for dividends and long-term growth, many scholars zakat only the company's underlying zakatable assets, not the full share price. A common simplification is roughly 25 to 40 percent of value. Adjust the portion to match guidance you follow, or use your fund's published zakatable percentage.",
  },
  crypto: {
    key: "crypto",
    label: "Cryptocurrency",
    group: "investments",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Where held as a tradable asset, the common position is full market value, treated like a currency or trade good.",
  },
  business_inventory: {
    key: "business_inventory",
    label: "Business inventory",
    group: "business",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Goods held for sale are zakatable at their current resale value, not their cost.",
  },
  receivables: {
    key: "receivables",
    label: "Money owed to you",
    group: "business",
    defaultZakatablePortion: 1,
    portionEditable: true,
    note: "Debts you expect to recover are generally zakatable now. Doubtful debts are often deferred until received; lower the portion if recovery is uncertain.",
  },
  pension: {
    key: "pension",
    label: "Pension / retirement",
    group: "investments",
    defaultZakatablePortion: 0.25,
    portionEditable: true,
    note: "Treatment depends heavily on access and structure. Where funds are inaccessible, some scholars defer zakat until withdrawal. Set the portion to reflect the ruling you follow.",
  },
  other: {
    key: "other",
    label: "Other zakatable asset",
    group: "other",
    defaultZakatablePortion: 1,
    portionEditable: true,
    note: "Use for anything not listed. Set the zakatable portion yourself.",
  },
};

export const CATEGORY_LIST: CategoryMeta[] = Object.values(CATEGORIES);

export function categoryMeta(key: string): CategoryMeta {
  return CATEGORIES[key as CategoryKey] ?? CATEGORIES.other;
}
