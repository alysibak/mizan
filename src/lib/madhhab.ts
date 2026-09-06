import {
  CATEGORIES,
  type CategoryKey,
  type CategoryMeta,
} from "./categories";

/**
 * School profile — convenience defaults for disputed items, not a fatwa.
 *
 * Only jewellery has clear classical school differences encoded here.
 * Equity and pension portions are modern estimates shared across profiles;
 * they are NOT classical madhhab rulings about stocks.
 */
export const MADHHABS = [
  "general",
  "hanafi",
  "maliki",
  "shafii",
  "hanbali",
] as const;

export type Madhhab = (typeof MADHHABS)[number];

export const MADHHAB_LABELS: Record<Madhhab, string> = {
  general: "General / undecided",
  hanafi: "Hanafi",
  maliki: "Maliki",
  shafii: "Shafi'i",
  hanbali: "Hanbali",
};

type Override = Partial<
  Pick<CategoryMeta, "defaultZakatablePortion" | "portionEditable" | "note">
>;

/** Shared modern estimates — not attributed to a classical school. */
const MODERN_ESTIMATES: Partial<Record<CategoryKey, Override>> = {
  stocks_longterm: {
    defaultZakatablePortion: 0.25,
    portionEditable: true,
    note: "Modern estimate: many advisers count roughly 25–40% of long-term share value as a stand-in for underlying zakatable assets. This is not classical madhhab “stock law.” Prefer your fund’s published zakatable % or a scholar’s method.",
  },
  pension: {
    defaultZakatablePortion: 0.25,
    portionEditable: true,
    note: "Modern estimate. Access and structure matter more than school label. Inaccessible funds are often deferred until withdrawal — set the portion to the ruling you follow.",
  },
};

const JEWELLERY: Record<Madhhab, Override> = {
  general: {
    defaultZakatablePortion: 0,
    portionEditable: true,
    note: "Schools differ on jewellery worn for adornment. Default is not counted. Pick a school below or set the portion yourself after asking someone of knowledge.",
  },
  hanafi: {
    defaultZakatablePortion: 1,
    portionEditable: true,
    note: "Hanafi position commonly treats gold and silver jewellery as zakatable when nisab is met, including items in personal use. Confirm for your situation.",
  },
  maliki: {
    defaultZakatablePortion: 0,
    portionEditable: true,
    note: "Maliki practice commonly exempts jewellery kept for personal adornment. Count investment gold under Gold (investment).",
  },
  shafii: {
    defaultZakatablePortion: 0,
    portionEditable: true,
    note: "Shafi'i practice commonly exempts jewellery for personal use. Investment gold belongs under Gold (investment) at full value.",
  },
  hanbali: {
    defaultZakatablePortion: 0,
    portionEditable: true,
    note: "Hanbali practice commonly exempts jewellery for personal adornment. Investment pieces should be entered as Gold (investment).",
  },
};

export function isMadhhab(value: string | null | undefined): value is Madhhab {
  return MADHHABS.includes(value as Madhhab);
}

export function parseMadhhab(value: string | null | undefined): Madhhab {
  return isMadhhab(value) ? value : "general";
}

/** Category metadata with school jewellery defaults + modern equity/pension notes. */
export function categoryForMadhhab(
  key: string,
  madhhab: Madhhab = "general",
): CategoryMeta {
  const base = CATEGORIES[key as CategoryKey] ?? CATEGORIES.other;
  let meta = base;

  const modern = MODERN_ESTIMATES[base.key];
  if (modern) meta = { ...meta, ...modern };

  if (base.key === "jewellery") {
    meta = { ...meta, ...JEWELLERY[madhhab] };
  }

  return meta;
}

export function defaultPortion(key: string, madhhab: Madhhab = "general"): number {
  return categoryForMadhhab(key, madhhab).defaultZakatablePortion;
}

export function madhhabSummary(madhhab: Madhhab): string {
  switch (madhhab) {
    case "hanafi":
      return "Affects jewellery defaults (often counted). Equity and pension figures stay modern estimates — not classical stock rulings.";
    case "maliki":
    case "shafii":
    case "hanbali":
      return "Affects jewellery defaults (personal use often exempt). Equity and pension figures stay modern estimates — not classical stock rulings.";
    default:
      return "Jewellery left unset by default. Equity/pension use modern estimates. Confirm disputed items with someone of knowledge.";
  }
}
