/** The eight classical zakat recipient categories (asnaf). Educational labels only. */
export const ASNAF = [
  {
    key: "faqir",
    label: "Al-fuqara’ (the poor)",
    note: "Those with little or no wealth relative to need.",
  },
  {
    key: "miskin",
    label: "Al-masakin (the needy)",
    note: "Those whose means fall short of sufficiency.",
  },
  {
    key: "amil",
    label: "Al-‘amilin (administrators)",
    note: "Those appointed to collect and distribute zakat.",
  },
  {
    key: "muallaf",
    label: "Al-mu’allafah qulubuhum",
    note: "Those whose hearts are to be reconciled — usage is contested today.",
  },
  {
    key: "riqab",
    label: "Fi al-riqab",
    note: "Historically those in bondage; modern analogies vary by scholar.",
  },
  {
    key: "gharim",
    label: "Al-gharimin (debtors)",
    note: "Those burdened by debt who cannot reasonably repay.",
  },
  {
    key: "fisabilillah",
    label: "Fi sabil Allah",
    note: "In the path of God — scope is disputed; ask who you trust.",
  },
  {
    key: "ibn_sabil",
    label: "Ibn al-sabil (traveller)",
    note: "The stranded traveller cut off from their wealth.",
  },
] as const;

export type AsnafKey = (typeof ASNAF)[number]["key"];

export const ASNAF_KEYS = ASNAF.map((a) => a.key) as [AsnafKey, ...AsnafKey[]];

export function asnafLabel(key: string | null | undefined): string | null {
  if (!key) return null;
  return ASNAF.find((a) => a.key === key)?.label ?? null;
}

export function parseAsnaf(value: unknown): AsnafKey | null {
  if (typeof value !== "string" || !value) return null;
  return ASNAF_KEYS.includes(value as AsnafKey) ? (value as AsnafKey) : null;
}
