/** The eight groups who may receive zakat (asnaf), Quran 9:60. Educational labels only. */
export const ASNAF = [
  {
    key: "faqir",
    label: "The poor (al-fuqara’)",
    note: "People with little or nothing to live on.",
  },
  {
    key: "miskin",
    label: "The needy (al-masakin)",
    note: "People who have something, but not enough.",
  },
  {
    key: "amil",
    label: "Zakat workers (al-‘amilin)",
    note: "People appointed to collect and hand out zakat.",
  },
  {
    key: "muallaf",
    label: "Hearts to be brought close (al-mu’allafah qulubuhum)",
    note: "New Muslims and others whose hearts are being won. Scholars differ on it today.",
  },
  {
    key: "riqab",
    label: "Freeing people (fi al-riqab)",
    note: "Once, freeing slaves. Scholars differ on what it covers today.",
  },
  {
    key: "gharim",
    label: "People in debt (al-gharimin)",
    note: "People weighed down by debts they cannot pay.",
  },
  {
    key: "fisabilillah",
    label: "In the way of Allah (fi sabil Allah)",
    note: "Scholars differ on how wide this is. Ask someone you trust.",
  },
  {
    key: "ibn_sabil",
    label: "Stranded travellers (ibn al-sabil)",
    note: "Travellers cut off from their money, far from home.",
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
