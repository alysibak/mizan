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
    note: "The Hanafi madhhab usually counts gold and silver jewellery, even pieces you wear. Check for your own case.",
  },
  maliki: {
    defaultZakatablePortion: 0,
    portionEditable: true,
    note: "The Maliki madhhab usually does not count jewellery you wear. Put gold kept as savings under Gold coins and bars.",
  },
  shafii: {
    defaultZakatablePortion: 0,
    portionEditable: true,
    note: "The Shafi'i madhhab usually does not count jewellery you wear. Put gold kept as savings under Gold coins and bars.",
  },
  hanbali: {
    defaultZakatablePortion: 0,
    portionEditable: true,
    note: "The Hanbali madhhab usually does not count jewellery you wear. Put gold kept as savings under Gold coins and bars.",
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
      return "Jewellery you wear is counted, as the Hanafi madhhab usually holds.";
    case "maliki":
    case "shafii":
    case "hanbali":
      return "Jewellery you wear is not counted, as this madhhab usually holds.";
    default:
      return "Jewellery you wear is not counted unless you say so. Ask someone you trust about anything you are unsure of.";
  }
}
