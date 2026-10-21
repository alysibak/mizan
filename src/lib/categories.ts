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
  | "jewellery"
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
    note: "Cash counts in full.",
  },
  bank: {
    key: "bank",
    label: "Bank balances",
    group: "liquid",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Bank balances count in full. Any interest is not yours to keep: give it away separately, and do not count it here.",
  },
  gold: {
    key: "gold",
    label: "Gold coins and bars",
    group: "metals",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Gold you keep as savings counts in full, at today’s price.",
  },
  silver: {
    key: "silver",
    label: "Silver coins and bars",
    group: "metals",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Silver you keep as savings counts in full, at today’s price.",
  },
  jewellery: {
    key: "jewellery",
    label: "Jewellery you wear",
    group: "metals",
    defaultZakatablePortion: 0,
    portionEditable: true,
    note: "The madhhabs differ on jewellery you wear. It is not counted unless you choose your madhhab in Settings or set the part that counts yourself.",
  },
  stocks_trading: {
    key: "stocks_trading",
    label: "Shares you trade",
    group: "investments",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Shares bought to sell again count in full, at today’s price.",
  },
  stocks_longterm: {
    key: "stocks_longterm",
    label: "Shares you keep",
    group: "investments",
    defaultZakatablePortion: 0.25,
    portionEditable: true,
    note: "For shares you keep for the long run, many count about 25 to 40 percent of today’s value. This is a modern rule of thumb: change it to what you follow, or to the figure your fund publishes.",
  },
  crypto: {
    key: "crypto",
    label: "Cryptocurrency",
    group: "investments",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Most count crypto in full, at today’s price, like money.",
  },
  business_inventory: {
    key: "business_inventory",
    label: "Goods for sale",
    group: "business",
    defaultZakatablePortion: 1,
    portionEditable: false,
    note: "Goods you sell count at what they would sell for today, not what you paid.",
  },
  receivables: {
    key: "receivables",
    label: "Money owed to you",
    group: "business",
    defaultZakatablePortion: 1,
    portionEditable: true,
    note: "Money you expect to get back usually counts now. If you are not sure you will be paid, many count it only once it is paid: lower the part that counts.",
  },
  pension: {
    key: "pension",
    label: "Pension",
    group: "investments",
    defaultZakatablePortion: 0.25,
    portionEditable: true,
    note: "Scholars differ. If you cannot take the money out yet, some say zakat waits until you can. Set the part that counts to what you follow.",
  },
  other: {
    key: "other",
    label: "Something else",
    group: "other",
    defaultZakatablePortion: 1,
    portionEditable: true,
    note: "For anything not listed. Set the part that counts yourself.",
  },
};

export const CATEGORY_LIST: CategoryMeta[] = Object.values(CATEGORIES);

export function categoryMeta(key: string): CategoryMeta {
  return CATEGORIES[key as CategoryKey] ?? CATEGORIES.other;
}
