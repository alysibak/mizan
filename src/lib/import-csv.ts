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

type AmountRead = { value: number } | { negative: true } | null;

/**
 * Read a money cell. Currency symbols, codes, and thousands commas are
 * ignored. A negative figure (-500, (500), or 500-) is reported rather than
 * flipped: on a statement it is usually a debt, which belongs under
 * liabilities, not in wealth.
 */
function parseAmount(raw: string): AmountRead {
  const kept = raw.replace(/[^\d.,()\-]/g, "");
  const digits = kept.replace(/[(),\-]/g, "");
  if (!digits || !/\d/.test(digits)) return null;
  const n = Number(digits);
  if (!Number.isFinite(n)) return null;
  const negative =
    kept.startsWith("-") || kept.endsWith("-") || /^\(.*\)$/.test(kept);
  if (negative && n !== 0) return { negative: true };
  return { value: n };
}

/** Read a portion cell: "0.3", "30", or "30%" all mean 30%. */
function parsePortion(raw: string): number | null {
  const percent = raw.includes("%");
  const p = Number(raw.replace(/[%\s]/g, ""));
  if (!Number.isFinite(p) || p < 0) return null;
  const fraction = percent || p > 1 ? p / 100 : p;
  return Math.min(1, Math.max(0, fraction));
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
 *
 * `defaultPortion` supplies the portion for rows without one (pass the
 * school-aware default so jewellery follows the user's madhhab profile).
 */
export function parseAssetCsv(
  text: string,
  defaultPortion: (category: CategoryKey) => number = (c) =>
    categoryMeta(c).defaultZakatablePortion,
): ParseResult {
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
    if ("negative" in amount) {
      errors.push(
        `Line ${lineNo}: “${label}” is negative — add it under liabilities instead.`,
      );
      return;
    }
    const category = asCategory(
      categoryIdx >= 0 ? cells[categoryIdx] : undefined,
      label,
    );
    let portion = defaultPortion(category);
    if (portionIdx >= 0 && cells[portionIdx]) {
      portion = parsePortion(cells[portionIdx]) ?? portion;
    }
    rows.push({
      category,
      label: label.slice(0, 120),
      amount: amount.value,
      zakatablePortion: portion,
    });
  });

  return { rows, errors };
}

export const SAMPLE_CSV = `category,label,amount,zakatablePortion
bank,Chequing,9500,1
cash,Cash on hand,1500,1
gold,Gold coins,3200,1
stocks_longterm,Index funds,12000,0.3
`;
