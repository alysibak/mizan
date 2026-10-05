// The public zakat calculator: a draft of what someone owns and owes, kept in
// their own browser, turned into input for the same engine the ledger uses.
// Pure, so every rule here is unit-tested.

import { calculateZakat, type ZakatResult } from "./zakat";
import { valueByWeight, type Metal } from "./metals";
import { toCents } from "./money";
import type { CategoryKey } from "./categories";

export type CalcFieldKey =
  | "cash"
  | "bank"
  | "gold"
  | "silver"
  | "jewellery"
  | "trading"
  | "crypto"
  | "longterm"
  | "business"
  | "receivables"
  | "pension"
  | "other";

export type WeighableKey = "gold" | "silver" | "jewellery";
export type PortionKey = "longterm" | "pension";

export interface CalcField {
  key: CalcFieldKey;
  category: CategoryKey;
  label: string;
  hint: string;
  /** Can be entered in grams, priced from the metal price. */
  metal?: Metal;
  /** The share of the value that is zakatable is the user's to set. */
  portion?: PortionKey;
}

export const CALC_FIELDS: CalcField[] = [
  {
    key: "cash",
    category: "cash",
    label: "Cash in hand",
    hint: "Notes and coins at home or in your wallet.",
  },
  {
    key: "bank",
    category: "bank",
    label: "Bank balances",
    hint: "Current, savings and deposit accounts. Leave out interest earned: give it away separately.",
  },
  {
    key: "gold",
    category: "gold",
    label: "Gold you keep as savings",
    hint: "Coins, bars, and gold bought as an investment.",
    metal: "gold",
  },
  {
    key: "silver",
    category: "silver",
    label: "Silver you keep as savings",
    hint: "Coins, bars, and silver bought as an investment.",
    metal: "silver",
  },
  {
    key: "jewellery",
    category: "jewellery",
    label: "Gold jewellery you wear",
    hint: "Counted or not according to the choice below.",
    metal: "gold",
  },
  {
    key: "trading",
    category: "stocks_trading",
    label: "Shares and funds you trade",
    hint: "Bought to sell on: counted at today’s market value.",
  },
  {
    key: "crypto",
    category: "crypto",
    label: "Cryptocurrency",
    hint: "At today’s market value.",
  },
  {
    key: "longterm",
    category: "stocks_longterm",
    label: "Long-term shares and funds",
    hint: "Held for growth and dividends. Only part of the value is counted; set the share you follow.",
    portion: "longterm",
  },
  {
    key: "business",
    category: "business_inventory",
    label: "Business stock for sale",
    hint: "At what it would sell for today, not what it cost.",
  },
  {
    key: "receivables",
    category: "receivables",
    label: "Money owed to you",
    hint: "Loans you expect to be repaid. Leave out debts you doubt you will see.",
  },
  {
    key: "pension",
    category: "pension",
    label: "Pension you can withdraw",
    hint: "Treatment differs widely. Set the share you follow, or leave it out if you cannot access it.",
    portion: "pension",
  },
  {
    key: "other",
    category: "other",
    label: "Anything else zakatable",
    hint: "Rental income saved, a deposit you will get back, and the like.",
  },
];

export const DEFAULT_PORTION_PERCENT: Record<PortionKey, string> = {
  longterm: "25",
  pension: "25",
};

export interface CalcDraft {
  v: 1;
  currency: string;
  /** Price per gram, as typed. */
  goldPrice: string;
  silverPrice: string;
  /** When the prices were filled from the live suggestion, if they were. */
  pricesAsOf: string | null;
  standard: "silver" | "gold";
  basis: "lunar" | "solar";
  /** Count jewellery worn for adornment (the Hanafi position). */
  jewelleryCounted: boolean;
  amounts: Partial<Record<CalcFieldKey, string>>;
  byWeight: Partial<Record<WeighableKey, boolean>>;
  grams: Partial<Record<WeighableKey, string>>;
  /** Fineness 0..1 as typed, e.g. "0.916" for 22 karat. */
  purity: Partial<Record<WeighableKey, string>>;
  portions: Partial<Record<PortionKey, string>>;
  debts: string;
}

export const CALC_STORAGE_KEY = "mizan-calculator-v1";

export function emptyDraft(currency = "USD"): CalcDraft {
  return {
    v: 1,
    currency,
    goldPrice: "",
    silverPrice: "",
    pricesAsOf: null,
    standard: "silver",
    basis: "lunar",
    jewelleryCounted: false,
    amounts: {},
    byWeight: {},
    grams: {},
    purity: {},
    portions: {},
    debts: "",
  };
}

const MAX = 1e12;

/**
 * A typed amount as a number. Forgiving: "12,500", "12 500", "$12,500.50",
 * and "1.234,56" all read as people mean them. Blank, negative, or nonsense
 * reads as 0.
 */
export function parseAmount(raw: string | null | undefined): number {
  if (!raw) return 0;
  let s = raw.replace(/[\s  '’_]/g, "").replace(/[^\d.,-]/g, "");
  if (s.startsWith("-")) return 0;
  s = s.replace(/-/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    // Both marks: the later one is the decimal point.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const commas = s.split(",").length - 1;
    const decimals = s.length - lastComma - 1;
    // One comma followed by one or two digits is a decimal comma ("12,5").
    s = commas === 1 && decimals >= 1 && decimals <= 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (s.split(".").length > 2) {
    // "1.234.567" groups thousands with dots.
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX) : 0;
}

/** A portion typed as a percentage, as a fraction 0..1. */
export function parsePercent(raw: string | null | undefined, fallback: number): number {
  if (raw === undefined || raw === null || raw.trim() === "") return fallback;
  const n = Number(raw.replace(",", ".").replace("%", "").trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n / 100));
}

/** Fineness as typed: "0.916", "91.6", "916", or "22k" all mean 22 karat. */
export function parsePurity(raw: string | null | undefined): number {
  if (!raw || raw.trim() === "") return 1;
  const t = raw.trim().toLowerCase();
  const karat = /^(\d{1,2}(?:\.\d+)?)\s*(k|kt|ct|karat|carat)$/.exec(t);
  if (karat) return Math.min(1, Number(karat[1]) / 24);
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 1;
  if (n <= 1) return n;
  if (n <= 100) return n / 100;
  if (n <= 1000) return n / 1000;
  return 1;
}

export interface CalcLine {
  key: CalcFieldKey;
  category: CategoryKey;
  label: string;
  amount: number;
  zakatablePortion: number;
  grams: number | null;
  purity: number | null;
  metal: Metal | null;
}

export interface CalcPrices {
  goldPricePerGram: number;
  silverPricePerGram: number;
}

export function draftPrices(draft: CalcDraft): CalcPrices {
  return {
    goldPricePerGram: parseAmount(draft.goldPrice),
    silverPricePerGram: parseAmount(draft.silverPrice),
  };
}

/** Each non-empty holding in the draft, valued and with its zakatable share. */
export function draftLines(draft: CalcDraft): CalcLine[] {
  const prices = draftPrices(draft);
  const lines: CalcLine[] = [];
  for (const field of CALC_FIELDS) {
    const weighable = field.metal ? (field.key as WeighableKey) : null;
    let amount: number;
    let grams: number | null = null;
    let purity: number | null = null;
    if (weighable && draft.byWeight[weighable]) {
      grams = parseAmount(draft.grams[weighable]);
      purity = parsePurity(draft.purity[weighable]);
      const perGram =
        field.metal === "silver" ? prices.silverPricePerGram : prices.goldPricePerGram;
      amount = valueByWeight(grams, purity, perGram);
      if (!(grams > 0)) continue;
    } else {
      amount = toCents(parseAmount(draft.amounts[field.key]));
      if (!(amount > 0)) continue;
    }

    let portion = 1;
    if (field.portion) {
      portion = parsePercent(
        draft.portions[field.portion],
        Number(DEFAULT_PORTION_PERCENT[field.portion]) / 100,
      );
    } else if (field.key === "jewellery") {
      portion = draft.jewelleryCounted ? 1 : 0;
    }

    lines.push({
      key: field.key,
      category: field.category,
      label: field.label,
      amount,
      zakatablePortion: portion,
      grams,
      purity,
      metal: grams ? (field.metal ?? null) : null,
    });
  }
  return lines;
}

export interface CalcOutcome {
  lines: CalcLine[];
  debts: number;
  result: ZakatResult;
  /** The chosen standard's metal price is missing, so nisab is unknown. */
  needsPrices: boolean;
  /** Something is weighed in grams but its metal price is missing. */
  needsWeightPrice: boolean;
}

export function computeDraft(draft: CalcDraft): CalcOutcome {
  const lines = draftLines(draft);
  const prices = draftPrices(draft);
  const debts = toCents(parseAmount(draft.debts));
  const result = calculateZakat({
    assets: lines,
    liabilities: debts > 0 ? [{ label: "Debts due now", amount: debts, deductible: true }] : [],
    prices,
    standard: draft.standard,
    basis: draft.basis,
  });
  const needsPrices =
    draft.standard === "gold" ? !(prices.goldPricePerGram > 0) : !(prices.silverPricePerGram > 0);
  const needsWeightPrice = CALC_FIELDS.some((f) => {
    const k = f.key as WeighableKey;
    if (!f.metal || !draft.byWeight[k] || !(parseAmount(draft.grams[k]) > 0)) return false;
    return f.metal === "silver" ? !(prices.silverPricePerGram > 0) : !(prices.goldPricePerGram > 0);
  });
  return { lines, debts, result, needsPrices, needsWeightPrice };
}

/** True when nothing has been entered yet. */
export function draftIsEmpty(draft: CalcDraft): boolean {
  return draftLines(draft).length === 0 && !(parseAmount(draft.debts) > 0);
}

function str(v: unknown, max = 40): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function strMap<K extends string>(v: unknown, keys: readonly K[]): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  if (!v || typeof v !== "object") return out;
  for (const k of keys) {
    const s = str((v as Record<string, unknown>)[k]);
    if (s) out[k] = s;
  }
  return out;
}

const FIELD_KEYS = CALC_FIELDS.map((f) => f.key);
const WEIGHABLE_KEYS: readonly WeighableKey[] = ["gold", "silver", "jewellery"];
const PORTION_KEYS: readonly PortionKey[] = ["longterm", "pension"];

/** A stored draft, checked field by field. Anything unreadable falls back. */
export function parseDraft(raw: string | null | undefined): CalcDraft | null {
  if (!raw) return null;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || data.v !== 1) return null;
  const currency = str(data.currency, 3).toUpperCase();
  const byWeight: Partial<Record<WeighableKey, boolean>> = {};
  const rawWeight = (data.byWeight ?? {}) as Record<string, unknown>;
  for (const k of WEIGHABLE_KEYS) if (rawWeight[k] === true) byWeight[k] = true;
  return {
    v: 1,
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "USD",
    goldPrice: str(data.goldPrice),
    silverPrice: str(data.silverPrice),
    pricesAsOf: str(data.pricesAsOf, 40) || null,
    standard: data.standard === "gold" ? "gold" : "silver",
    basis: data.basis === "solar" ? "solar" : "lunar",
    jewelleryCounted: data.jewelleryCounted === true,
    amounts: strMap(data.amounts, FIELD_KEYS),
    byWeight,
    grams: strMap(data.grams, WEIGHABLE_KEYS),
    purity: strMap(data.purity, WEIGHABLE_KEYS),
    portions: strMap(data.portions, PORTION_KEYS),
    debts: str(data.debts),
  };
}

export interface LedgerCarryOver {
  currency: string;
  prices: CalcPrices;
  assets: {
    category: CategoryKey;
    label: string;
    amount: number;
    zakatablePortion: number;
    grams?: number;
    purity?: number;
    metal?: Metal;
  }[];
  liabilities: { label: string; amount: number; deductible: true }[];
}

/** The draft as ledger rows, for bringing it into a new account. */
export function draftToLedger(draft: CalcDraft): LedgerCarryOver {
  return {
    currency: draft.currency,
    prices: draftPrices(draft),
    assets: draftLines(draft).map((l) => ({
      category: l.category,
      label: l.label,
      amount: l.amount,
      zakatablePortion: l.zakatablePortion,
      ...(l.grams && l.metal
        ? { grams: l.grams, purity: l.purity ?? 1, metal: l.metal }
        : {}),
    })),
    liabilities:
      parseAmount(draft.debts) > 0
        ? [{ label: "Debts due now", amount: toCents(parseAmount(draft.debts)), deductible: true }]
        : [],
  };
}

/** A sensible starting currency from the browser's region, e.g. en-PK → PKR. */
const REGION_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", GB: "GBP", IE: "EUR", AU: "AUD", NZ: "NZD", ZA: "ZAR",
  DE: "EUR", FR: "EUR", NL: "EUR", BE: "EUR", ES: "EUR", IT: "EUR", AT: "EUR",
  FI: "EUR", PT: "EUR", GR: "EUR", SE: "SEK", NO: "NOK", DK: "DKK", CH: "CHF",
  SA: "SAR", AE: "AED", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR", JO: "JOD",
  EG: "EGP", MA: "MAD", DZ: "DZD", TN: "TND", LY: "LYD", IQ: "IQD", LB: "LBP",
  SD: "SDG", TR: "TRY", PK: "PKR", IN: "INR", BD: "BDT", LK: "LKR", MV: "MVR",
  AF: "AFN", ID: "IDR", MY: "MYR", SG: "SGD", BN: "BND", PH: "PHP", TH: "THB",
  NG: "NGN", GH: "GHS", KE: "KES", TZ: "TZS", UG: "UGX", ET: "ETB", SO: "SOS",
  SN: "XOF", ML: "XOF", CI: "XOF", NE: "XOF", BF: "XOF", UZ: "UZS", KZ: "KZT",
  AZ: "AZN", BA: "BAM", AL: "ALL", XK: "EUR", RU: "RUB", BR: "BRL", MX: "MXN",
  JP: "JPY", KR: "KRW", CN: "CNY", HK: "HKD",
};

export function currencyForLocale(locale: string | null | undefined): string {
  if (!locale) return "USD";
  try {
    const region = new Intl.Locale(locale).maximize().region;
    return (region && REGION_CURRENCY[region]) || "USD";
  } catch {
    return "USD";
  }
}

/** Currencies offered in the calculator's picker, most-used first. */
export const CALC_CURRENCIES = [
  "USD", "GBP", "EUR", "CAD", "AUD", "SAR", "AED", "QAR", "KWD", "BHD", "OMR",
  "JOD", "EGP", "MAD", "DZD", "TND", "TRY", "PKR", "INR", "BDT", "LKR", "IDR",
  "MYR", "SGD", "BND", "NGN", "GHS", "KES", "TZS", "UGX", "ZAR", "XOF", "ETB",
  "SOS", "SDG", "IQD", "LYD", "AFN", "UZS", "KZT", "AZN", "BAM", "ALL", "MVR",
  "NZD", "CHF", "SEK", "NOK", "DKK", "PHP", "THB", "RUB", "BRL", "MXN", "JPY",
  "KRW", "CNY", "HKD", "LBP",
] as const;
