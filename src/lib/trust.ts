/**
 * What Mizan asserts, and how strongly.
 *
 * VERIFIED — classical / widely agreed; covered by unit tests where numeric.
 * ESTIMATE — contemporary practice or arithmetic convenience; must be labeled.
 * DISPUTED — scholars differ; UI must not sound settled.
 */

export const TRUST = {
  zakatRateLunar: {
    level: "verified" as const,
    claim: "One-fortieth (2.5%) of zakatable wealth on a lunar year",
    source: "Classical consensus on the rate for cash wealth (māl)",
  },
  nisabGoldGrams: {
    level: "verified" as const,
    claim: "Gold nisab ≈ 85 grams (20 dinars / mithqāl)",
    source: "Widely cited prophetic weight standard",
  },
  nisabSilverGrams: {
    level: "verified" as const,
    claim: "Silver nisab ≈ 595 grams (200 dirhams)",
    source: "Widely cited prophetic weight standard",
  },
  solarRateAdjustment: {
    level: "estimate" as const,
    claim: "Solar calendar uses 2.5% × (365.25 / 354.367) ≈ 2.577%",
    source: "Modern calendar-length adjustment, not a separate prophetic rate",
  },
  equityPortion: {
    level: "estimate" as const,
    claim: "Long-term equities often counted at a partial portion (~25%)",
    source: "Contemporary simplification of company-asset approaches; not classical madhhab stock law",
  },
  jewelleryBySchool: {
    level: "disputed" as const,
    claim: "Personal-use jewellery: often zakatable (Hanafi) vs often exempt (other schools)",
    source: "Well-known school difference; confirm for your situation",
  },
  aaoifiScreens: {
    level: "estimate" as const,
    claim: "Debt / cash / impermissible-income screens near 30% / 30% / 5%",
    source: "Commonly cited AAOIFI-style thresholds; index providers differ",
  },
  tabularHawl: {
    level: "estimate" as const,
    claim: "Hawl counted on a tabular (or optional Umm al-Qura) Hijri calendar",
    source: "May differ by a day or two from local moon-sighting",
  },
} as const;

export type TrustLevel = "verified" | "estimate" | "disputed";
