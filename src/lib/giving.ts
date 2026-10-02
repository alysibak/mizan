// Kinds of giving the ledger records. Only "zakat" counts toward the zakat
// outstanding for a hawl cycle; the others are tracked alongside it.

export const GIVING_TYPES = ["zakat", "sadaqah", "purification", "fitr"] as const;

export type GivingType = (typeof GIVING_TYPES)[number];

export const GIVING_TYPE_LABELS: Record<GivingType, string> = {
  zakat: "Zakat",
  sadaqah: "Sadaqah",
  purification: "Purification",
  fitr: "Zakat al-Fitr",
};

export function parseGivingType(value: unknown): GivingType | null {
  return GIVING_TYPES.includes(value as GivingType) ? (value as GivingType) : null;
}

export function givingTypeLabel(value: string): string {
  return GIVING_TYPE_LABELS[parseGivingType(value) ?? "sadaqah"];
}
