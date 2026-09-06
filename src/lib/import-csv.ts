import { CATEGORIES, categoryMeta, type CategoryKey } from "./categories";

export interface ImportRow {
  category: CategoryKey;
  label: string;
  amount: number;
  zakatablePortion: number;
}

export interface ParseResult {
  rows: ImportRow[];
  errors: string[];
}

const KEYS = Object.keys(CATEGORIES) as CategoryKey[];

const HEADER_ALIASES: Record<string, "category" | "label" | "amount" | "portion"> = {
  category: "category",
  type: "category",
  class: "category",
  label: "label",
  description: "label",
  name: "label",
  account: "label",
  memo: "label",
  amount: "amount",
  value: "amount",
  balance: "amount",
  total: "amount",
  portion: "portion",
  zakatableportion: "portion",
  zakatable: "portion",
  "%": "portion",
};

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z%]/g, "");
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === "\t" || ch === ";") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$£€CADUSDcadusd,\s]/g, "").replace(/[()]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.abs(n);
}

export function guessCategory(text: string): CategoryKey {
  const t = text.toLowerCase();
  if (/\b(jewel|jewellery|jewelry|ring|necklace|bracelet)\b/.test(t)) return "jewellery";
  if (/\b(gold|dinar|sovereign)\b/.test(t)) return "gold";
  if (/\b(silver|dirham)\b/.test(t)) return "silver";
  if (/\b(bitcoin|btc|eth|crypto|usdc|coinbase)\b/.test(t)) return "crypto";
  if (/\b(pension|rrsp|401k|rrif|retirement)\b/.test(t)) return "pension";
  if (/\b(inventory|stock in trade|goods for sale)\b/.test(t)) return "business_inventory";
  if (/\b(owed|receivable|invoice)\b/.test(t)) return "receivables";
  if (/\b(trading|day.?trade|margin)\b/.test(t)) return "stocks_trading";
  if (/\b(stock|etf|broker|brokerage|tfsa|rrsp|index|equity|share)\b/.test(t))
    return "stocks_longterm";
  if (/\b(cash on hand|wallet|petty)\b/.test(t)) return "cash";
  if (/\b(chequing|checking|savings|bank|account)\b/.test(t)) return "bank";
  return "other";
}

function asCategory(raw: string | undefined, label: string): CategoryKey {
  const key = (raw ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if ((KEYS as string[]).includes(key)) return key as CategoryKey;
  return guessCategory(`${raw ?? ""} ${label}`);
}

/**
 * Parse a pasted bank/broker export. Header row optional.
 * Accepts category,label,amount[,portion] or label,amount.
 */
export function parseAssetCsv(text: string): ParseResult {
  const errors: string[] = [];
  const rows: ImportRow[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) {
    return { rows, errors: ["Nothing to import."] };
  }

  const firstCells = splitCsvLine(lines[0]);
  const mapped = firstCells.map((c) => HEADER_ALIASES[normalizeHeader(c)]);
  const hasHeader = mapped.some(Boolean);
  const start = hasHeader ? 1 : 0;

  let categoryIdx = mapped.indexOf("category");
  let labelIdx = mapped.indexOf("label");
  let amountIdx = mapped.indexOf("amount");
  let portionIdx = mapped.indexOf("portion");

  if (!hasHeader) {
    if (firstCells.length === 1) {
      return { rows, errors: ["Each line needs a label and an amount."] };
    }
    if (firstCells.length === 2) {
      labelIdx = 0;
      amountIdx = 1;
      categoryIdx = -1;
      portionIdx = -1;
    } else {
      categoryIdx = 0;
      labelIdx = 1;
      amountIdx = 2;
      portionIdx = firstCells.length > 3 ? 3 : -1;
    }
  } else {
    if (labelIdx < 0) labelIdx = 0;
    if (amountIdx < 0) {
      amountIdx = firstCells.length > 1 ? 1 : 0;
    }
  }

  lines.slice(start).forEach((line, i) => {
    const lineNo = i + start + 1;
    const cells = splitCsvLine(line);
    const label = (cells[labelIdx] ?? "").trim();
    const amountRaw =
      amountIdx >= 0
        ? cells
            .slice(amountIdx, portionIdx >= 0 ? portionIdx : undefined)
            .join("")
        : "";
    const amount = parseAmount(amountRaw);
    if (!label) {
      errors.push(`Line ${lineNo}: missing description.`);
      return;
    }
    if (amount === null) {
      errors.push(`Line ${lineNo}: could not read an amount for “${label}”.`);
      return;
    }
    const category = asCategory(
      categoryIdx >= 0 ? cells[categoryIdx] : undefined,
      label,
    );
    let portion = categoryMeta(category).defaultZakatablePortion;
    if (portionIdx >= 0 && cells[portionIdx]) {
      const raw = cells[portionIdx].replace(/%/g, "");
      const p = Number(raw);
      if (Number.isFinite(p)) {
        portion = p > 1 ? Math.min(1, p / 100) : Math.min(1, Math.max(0, p));
      }
    }
    rows.push({ category, label, amount, zakatablePortion: portion });
  });

  return { rows, errors };
}

export const SAMPLE_CSV = `category,label,amount,zakatablePortion
bank,Chequing,9500,1
cash,Cash on hand,1500,1
gold,Gold coins,3200,1
stocks_longterm,Index funds,12000,0.3
`;
