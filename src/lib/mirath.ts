// Mirath: the Islamic law of inheritance (ilm al-faraid), Sunni framework.
//
// The estate is divided in stages: the fixed-share heirs (ashab al-furud) take
// their appointed fractions (1/2, 1/4, 1/8, 2/3, 1/3, 1/6), the residuary heirs
// (asaba) take what remains, and two corrections balance the books: awl shrinks
// every share proportionally when the fixed shares sum to more than the estate,
// and radd returns the surplus to the sharers (never the spouse) when they sum
// to less and there is no residuary.
//
// All arithmetic is exact rational arithmetic, because rounding a religious
// obligation is not acceptable. This is an estimation aid, not a fatwa. Several
// cases below are deliberately flagged as out of scope (most notably the
// grandfather-with-siblings problem, where the schools genuinely differ), and
// for any real estate you must consult a qualified scholar.

// ---------------------------------------------------------------------------
// Exact fractions
// ---------------------------------------------------------------------------

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

export class Fraction {
  readonly n: number;
  readonly d: number;
  constructor(n: number, d = 1) {
    if (d === 0) throw new Error("denominator cannot be zero");
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }
  add(o: Fraction): Fraction {
    return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o: Fraction): Fraction {
    return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o: Fraction): Fraction {
    return new Fraction(this.n * o.n, this.d * o.d);
  }
  div(o: Fraction): Fraction {
    return new Fraction(this.n * o.d, this.d * o.n);
  }
  cmp(o: Fraction): number {
    return this.n * o.d - o.n * this.d;
  }
  isZero(): boolean {
    return this.n === 0;
  }
  get value(): number {
    return this.n / this.d;
  }
  toString(): string {
    return this.d === 1 ? `${this.n}` : `${this.n}/${this.d}`;
  }
}

const F0 = new Fraction(0);
const F1 = new Fraction(1);
const f = (n: number, d = 1) => new Fraction(n, d);

// ---------------------------------------------------------------------------
// Heirs
// ---------------------------------------------------------------------------

export type HeirKey =
  | "husband"
  | "wife"
  | "father"
  | "mother"
  | "paternalGrandfather"
  | "maternalGrandmother"
  | "paternalGrandmother"
  | "son"
  | "daughter"
  | "sonsSon"
  | "sonsDaughter"
  | "fullBrother"
  | "fullSister"
  | "paternalBrother"
  | "paternalSister"
  | "maternalBrother"
  | "maternalSister";

export type Heirs = Partial<Record<HeirKey, number>>;

export const HEIR_LABELS: Record<HeirKey, string> = {
  husband: "Husband",
  wife: "Wife",
  father: "Father",
  mother: "Mother",
  paternalGrandfather: "Paternal grandfather",
  maternalGrandmother: "Maternal grandmother",
  paternalGrandmother: "Paternal grandmother",
  son: "Son",
  daughter: "Daughter",
  sonsSon: "Son's son",
  sonsDaughter: "Son's daughter",
  fullBrother: "Full brother",
  fullSister: "Full sister",
  paternalBrother: "Paternal half-brother",
  paternalSister: "Paternal half-sister",
  maternalBrother: "Maternal half-brother",
  maternalSister: "Maternal half-sister",
};

/** Most of each heir that can exist: one husband, up to four wives, one of each parent. */
export const HEIR_MAX: Record<HeirKey, number> = {
  husband: 1,
  wife: 4,
  father: 1,
  mother: 1,
  paternalGrandfather: 1,
  maternalGrandmother: 1,
  paternalGrandmother: 1,
  son: 30,
  daughter: 30,
  sonsSon: 30,
  sonsDaughter: 30,
  fullBrother: 30,
  fullSister: 30,
  paternalBrother: 30,
  paternalSister: 30,
  maternalBrother: 30,
  maternalSister: 30,
};

/** Heirs who take only as residuaries (or alongside one) and can be left with nothing. */
const RESIDUARY_ONLY: HeirKey[] = [
  "son",
  "sonsSon",
  "sonsDaughter",
  "fullBrother",
  "fullSister",
  "paternalBrother",
  "paternalSister",
];

const DISTANT_RELATIVES_NOTE =
  "This assumes no more distant male-line relatives survive (brother's sons, paternal uncles, or their sons). This engine does not model them; if any do, they take the remainder before radd or the treasury.";

export interface ShareLine {
  heir: HeirKey;
  count: number;
  /** Share of the whole estate for this group of heirs combined. */
  fraction: Fraction;
  /** Share for one individual in the group. */
  perHead: Fraction;
  basis: "fard" | "asaba" | "fard+asaba" | "radd";
  reason: string;
}

export interface MirathResult {
  shares: ShareLine[];
  totalDistributed: Fraction;
  baseDenominator: number;
  finalDenominator: number;
  awlApplied: boolean;
  raddApplied: boolean;
  toTreasury: Fraction; // undistributed remainder (bayt al-mal), classical view
  notes: string[];
  blocked: { heir: HeirKey; by: string }[];
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

export function distributeEstate(input: Heirs): MirathResult {
  const h: Record<HeirKey, number> = Object.fromEntries(
    (Object.keys(HEIR_LABELS) as HeirKey[]).map((k) => [
      k,
      Math.min(HEIR_MAX[k], Math.max(0, Math.floor(Number(input[k]) || 0))),
    ]),
  ) as Record<HeirKey, number>;

  const notes: string[] = [];
  const blocked: { heir: HeirKey; by: string }[] = [];

  // A deceased leaves a husband or wives, never both.
  if (h.husband > 0 && h.wife > 0) {
    h.wife = 0;
    notes.push("A husband and a wife cannot both inherit from the same person; the wife entry was ignored.");
  }

  // Presence flags ---------------------------------------------------------
  const maleDescendant = h.son > 0 || h.sonsSon > 0;
  const anyDescendant = maleDescendant || h.daughter > 0 || h.sonsDaughter > 0;
  const father = h.father > 0;
  const grandfather = h.paternalGrandfather > 0 && !father; // father blocks grandfather
  if (h.paternalGrandfather > 0 && father)
    blocked.push({ heir: "paternalGrandfather", by: "father" });

  const siblingCount =
    h.fullBrother + h.fullSister + h.paternalBrother + h.paternalSister + h.maternalBrother + h.maternalSister;

  // Allocation table -------------------------------------------------------
  const shares = new Map<HeirKey, { frac: Fraction; basis: ShareLine["basis"]; reason: string }>();
  const setShare = (k: HeirKey, frac: Fraction, basis: ShareLine["basis"], reason: string) =>
    shares.set(k, { frac, basis, reason });

  // --- Gharrawayn (Umariyyatan): spouse + mother + father only ------------
  // Grandparents are blocked by the parents and a single sibling by the
  // father, so their presence does not change the case. Two or more siblings
  // reduce the mother to 1/6 instead, which is the ordinary rule below.
  const onlyThree =
    h.mother > 0 &&
    father &&
    (h.husband > 0 || h.wife > 0) &&
    !anyDescendant &&
    siblingCount < 2;
  if (onlyThree) {
    if (h.maternalGrandmother > 0) blocked.push({ heir: "maternalGrandmother", by: "mother" });
    if (h.paternalGrandmother > 0) blocked.push({ heir: "paternalGrandmother", by: "mother" });
    (["fullBrother", "fullSister", "paternalBrother", "paternalSister", "maternalBrother", "maternalSister"] as HeirKey[]).forEach((k) => {
      if (h[k] > 0) blocked.push({ heir: k, by: "Father" });
    });
    if (h.husband > 0) {
      setShare("husband", f(1, 2), "fard", "1/2, no descendant");
      setShare("mother", f(1, 6), "fard", "1/3 of the remainder after the husband (Umariyyatan)");
      setShare("father", f(1, 3), "asaba", "remainder as residuary");
    } else {
      setShare("wife", f(1, 4), "fard", "1/4, no descendant");
      setShare("mother", f(1, 4), "fard", "1/3 of the remainder after the wife (Umariyyatan)");
      setShare("father", f(1, 2), "asaba", "remainder as residuary");
    }
    return finalize(shares, h, notes, blocked, F0);
  }

  // --- Spouse -------------------------------------------------------------
  if (h.husband > 0) {
    setShare("husband", anyDescendant ? f(1, 4) : f(1, 2), "fard", anyDescendant ? "1/4, descendant present" : "1/2, no descendant");
  }
  if (h.wife > 0) {
    setShare("wife", anyDescendant ? f(1, 8) : f(1, 4), "fard", anyDescendant ? "1/8, descendant present (shared)" : "1/4, no descendant (shared)");
  }

  // --- Mother -------------------------------------------------------------
  if (h.mother > 0) {
    const reduced = anyDescendant || siblingCount >= 2;
    setShare("mother", reduced ? f(1, 6) : f(1, 3), "fard", reduced ? "1/6, descendant or two or more siblings present" : "1/3");
  }

  // --- Grandmothers -------------------------------------------------------
  // Mother blocks all grandmothers; father blocks the paternal grandmother.
  const gmEligible: HeirKey[] = [];
  if (h.maternalGrandmother > 0) {
    if (h.mother > 0) blocked.push({ heir: "maternalGrandmother", by: "mother" });
    else gmEligible.push("maternalGrandmother");
  }
  if (h.paternalGrandmother > 0) {
    if (h.mother > 0) blocked.push({ heir: "paternalGrandmother", by: "mother" });
    else if (father) blocked.push({ heir: "paternalGrandmother", by: "father" });
    else gmEligible.push("paternalGrandmother");
  }
  if (gmEligible.length > 0) {
    const each = f(1, 6).div(f(gmEligible.length));
    gmEligible.forEach((k) => setShare(k, each, "fard", "1/6, shared among grandmothers"));
  }

  // --- Father / grandfather as sharer ------------------------------------
  // The acting ascendant (father, else grandfather) takes 1/6 when a male
  // descendant exists; with only female descendants it takes 1/6 plus residue;
  // with no descendant it is a pure residuary.
  const ascendant: HeirKey | null = father ? "father" : grandfather ? "paternalGrandfather" : null;
  if (ascendant) {
    if (maleDescendant) setShare(ascendant, f(1, 6), "fard", "1/6, male descendant present");
    else if (anyDescendant) setShare(ascendant, f(1, 6), "fard+asaba", "1/6 plus the residue, only female descendants");
    // else: pure residuary, handled in the asaba stage
  }

  // --- Descendants --------------------------------------------------------
  // Sons make all children residuary (2:1). Otherwise daughters take fixed
  // shares and the son's children fall in behind them.
  let childrenAreAsaba = false;
  if (h.son > 0) {
    childrenAreAsaba = true; // son(+daughter) is the asaba; resolved below
    if (h.sonsSon > 0) blocked.push({ heir: "sonsSon", by: "son" });
    if (h.sonsDaughter > 0) blocked.push({ heir: "sonsDaughter", by: "son" });
  } else {
    if (h.daughter === 1) setShare("daughter", f(1, 2), "fard", "1/2, a single daughter");
    if (h.daughter >= 2) setShare("daughter", f(2, 3), "fard", "2/3, two or more daughters");

    if (h.sonsSon > 0) {
      // Son's son makes the son's children residuary behind any daughters.
      childrenAreAsaba = true;
    } else if (h.sonsDaughter > 0) {
      if (h.daughter === 0) {
        if (h.sonsDaughter === 1) setShare("sonsDaughter", f(1, 2), "fard", "1/2, a single son's daughter");
        else setShare("sonsDaughter", f(2, 3), "fard", "2/3, two or more son's daughters");
      } else if (h.daughter === 1) {
        setShare("sonsDaughter", f(1, 6), "fard", "1/6, completing two-thirds with one daughter");
      } else {
        blocked.push({ heir: "sonsDaughter", by: "two or more daughters" });
      }
    }
  }

  // --- Siblings -----------------------------------------------------------
  // Siblings inherit only with no father, no grandfather, and no male
  // descendant. Maternal siblings are additionally blocked by any descendant.
  const ascendantBlocksSiblings = father || grandfather;
  if (grandfather && (h.fullBrother + h.fullSister + h.paternalBrother + h.paternalSister) > 0) {
    notes.push(
      "Grandfather is present alongside siblings. This engine applies the Hanafi position (the grandfather blocks the siblings like a father). The Maliki, Shafii, and Hanbali schools instead have the grandfather share with the siblings, and the result differs. Treat this case as needing a scholar.",
    );
  }

  if (!ascendantBlocksSiblings && !maleDescendant) {
    // Maternal (uterine) siblings: equal shares, blocked by any descendant.
    if (h.maternalBrother + h.maternalSister > 0) {
      if (anyDescendant) {
        if (h.maternalBrother > 0) blocked.push({ heir: "maternalBrother", by: "a descendant" });
        if (h.maternalSister > 0) blocked.push({ heir: "maternalSister", by: "a descendant" });
      } else {
        const total = h.maternalBrother + h.maternalSister;
        const block = total === 1 ? f(1, 6) : f(1, 3);
        const each = block.div(f(total));
        if (h.maternalBrother > 0) setShare("maternalBrother", each.mul(f(h.maternalBrother)), "fard", total === 1 ? "1/6, a single maternal sibling" : "share of 1/3, divided equally");
        if (h.maternalSister > 0) setShare("maternalSister", each.mul(f(h.maternalSister)), "fard", total === 1 ? "1/6, a single maternal sibling" : "share of 1/3, divided equally");
      }
    }

    const femaleDescendantTakesShare = !childrenAreAsaba && (h.daughter > 0 || h.sonsDaughter > 0);

    // Full siblings
    if (h.fullBrother > 0) {
      // residuary, resolved in asaba stage
    } else if (h.fullSister > 0) {
      if (femaleDescendantTakesShare) {
        // asaba maa al-ghayr: full sisters take the residue behind daughters
      } else {
        if (h.fullSister === 1) setShare("fullSister", f(1, 2), "fard", "1/2, a single full sister");
        else setShare("fullSister", f(2, 3), "fard", "2/3, two or more full sisters");
      }
    }

    // Paternal siblings: blocked by a full brother; paternal sisters are
    // blocked by two full sisters (who already take 2/3) unless a paternal
    // brother makes them residuary, and complete two-thirds behind one full sister.
    const fullBrotherBlocks = h.fullBrother > 0;
    if (fullBrotherBlocks) {
      if (h.paternalBrother > 0) blocked.push({ heir: "paternalBrother", by: "full brother" });
      if (h.paternalSister > 0) blocked.push({ heir: "paternalSister", by: "full brother" });
    } else if (!femaleDescendantTakesShare) {
      if (h.paternalBrother > 0) {
        // residuary
      } else if (h.paternalSister > 0) {
        if (h.fullSister === 0) {
          if (h.paternalSister === 1) setShare("paternalSister", f(1, 2), "fard", "1/2, a single paternal half-sister");
          else setShare("paternalSister", f(2, 3), "fard", "2/3, two or more paternal half-sisters");
        } else if (h.fullSister === 1) {
          setShare("paternalSister", f(1, 6), "fard", "1/6, completing two-thirds with one full sister");
        } else {
          blocked.push({ heir: "paternalSister", by: "two or more full sisters" });
        }
      }
    } else if (h.paternalSister > 0 && h.fullSister === 0) {
      // No full sister taking residue, so paternal sisters become asaba behind daughters.
    } else if (h.paternalSister > 0) {
      blocked.push({ heir: "paternalSister", by: "full sister taking the residue" });
    }
  } else {
    // Record blocked siblings for transparency.
    (["fullBrother", "fullSister", "paternalBrother", "paternalSister", "maternalBrother", "maternalSister"] as HeirKey[]).forEach((k) => {
      if (h[k] > 0 && !shares.has(k)) blocked.push({ heir: k, by: maleDescendant ? "a male descendant" : ascendant ? HEIR_LABELS[ascendant] : "an ascendant" });
    });
  }

  // --- Sum of fixed shares, then awl or asaba or radd ---------------------
  let fardSum = F0;
  shares.forEach((s) => {
    if (s.basis === "fard" || s.basis === "fard+asaba") fardSum = fardSum.add(s.frac);
  });

  // awl: fixed shares exceed the estate, shrink everyone proportionally.
  if (fardSum.cmp(F1) > 0) {
    notes.push("The fixed shares exceeded the estate, so awl was applied: every share is reduced proportionally.");
    const scale = F1.div(fardSum);
    shares.forEach((s, k) => {
      if (s.basis === "fard" || s.basis === "fard+asaba") shares.set(k, { ...s, frac: s.frac.mul(scale), basis: "fard" });
    });
    noteExhausted(shares, h, notes, blocked);
    return finalize(shares, h, notes, blocked, F0, true, false);
  }

  // Residue and the residuary heir(s).
  const residue = F1.sub(fardSum);
  const asabaAssigned = assignAsaba(shares, h, residue, { childrenAreAsaba, ascendant, anyDescendant, maleDescendant, ascendantBlocksSiblings });

  if (!residue.isZero() && asabaAssigned) {
    return finalize(shares, h, notes, blocked, F0);
  }

  if (residue.isZero()) {
    noteExhausted(shares, h, notes, blocked);
    return finalize(shares, h, notes, blocked, F0);
  }

  // radd: leftover with no residuary returns to the sharers, never the spouse.
  if (residue.cmp(F0) > 0 && !asabaAssigned) {
    const spouseShare = (shares.get("husband")?.frac ?? F0).add(shares.get("wife")?.frac ?? F0);
    let nonSpouseSum = F0;
    shares.forEach((s, k) => {
      if (k !== "husband" && k !== "wife") nonSpouseSum = nonSpouseSum.add(s.frac);
    });
    if (nonSpouseSum.isZero()) {
      notes.push(
        shares.size === 0
          ? "No heir entered here inherits. Classically the estate passes to the public treasury (bayt al-mal)."
          : "Only a spouse inherits a fixed share. Classically the remainder passes to the public treasury (bayt al-mal); some modern rulings return it to the spouse.",
      );
      notes.push(DISTANT_RELATIVES_NOTE);
      return finalize(shares, h, notes, blocked, residue);
    }
    notes.push("The fixed shares left a surplus with no residuary heir, so radd was applied: the surplus returns to the sharers in proportion, excluding the spouse.");
    notes.push(DISTANT_RELATIVES_NOTE);
    const fill = F1.sub(spouseShare).div(nonSpouseSum);
    shares.forEach((s, k) => {
      if (k !== "husband" && k !== "wife") shares.set(k, { ...s, frac: s.frac.mul(fill), basis: "radd" });
    });
    return finalize(shares, h, notes, blocked, F0, false, true);
  }

  return finalize(shares, h, notes, blocked, residue);
}

// Residuary heirs who are present and unblocked but get nothing because the
// fixed shares used up the estate. Reported, never silently dropped.
function noteExhausted(
  shares: Map<HeirKey, { frac: Fraction; basis: ShareLine["basis"]; reason: string }>,
  h: Record<HeirKey, number>,
  notes: string[],
  blocked: { heir: HeirKey; by: string }[],
) {
  const left = RESIDUARY_ONLY.filter(
    (k) => h[k] > 0 && !shares.has(k) && !blocked.some((b) => b.heir === k),
  );
  if (left.length === 0) return;
  left.forEach((k) => blocked.push({ heir: k, by: "the fixed shares, which used up the estate" }));
  const mushtaraka =
    h.husband > 0 &&
    (h.mother > 0 || h.maternalGrandmother > 0 || h.paternalGrandmother > 0) &&
    h.maternalBrother + h.maternalSister >= 2 &&
    (h.fullBrother > 0 || h.fullSister > 0) &&
    left.includes(h.fullBrother > 0 ? "fullBrother" : "fullSister");
  notes.push(
    mushtaraka
      ? "This is the Mushtaraka (Himariyya) case. Shown here as the Hanafi and Hanbali schools rule it: the full siblings get nothing. The Maliki and Shafi'i schools have them share the maternal siblings' third equally. Ask a scholar which applies."
      : "The fixed shares used up the whole estate, so the residuary heirs listed below receive nothing.",
  );
}

// Assign the residue to the nearest residuary heir. Returns true if assigned.
function assignAsaba(
  shares: Map<HeirKey, { frac: Fraction; basis: ShareLine["basis"]; reason: string }>,
  h: Record<HeirKey, number>,
  residue: Fraction,
  ctx: { childrenAreAsaba: boolean; ascendant: HeirKey | null; anyDescendant: boolean; maleDescendant: boolean; ascendantBlocksSiblings: boolean },
): boolean {
  if (residue.cmp(F0) <= 0) return false;
  const give2to1 = (males: HeirKey, mCount: number, females: HeirKey, fCount: number, reason: string) => {
    const units = mCount * 2 + fCount;
    const per = residue.div(f(units));
    if (mCount > 0) shares.set(males, { frac: per.mul(f(mCount * 2)), basis: "asaba", reason });
    if (fCount > 0) shares.set(females, { frac: per.mul(f(fCount)), basis: "asaba", reason });
  };

  // 1. Sons (with daughters, 2:1).
  if (h.son > 0) {
    give2to1("son", h.son, "daughter", h.daughter, "residuary, sons and daughters share two to one");
    return true;
  }
  // 2. Son's children (with daughters present, the son's son carries the son's daughters).
  if (ctx.childrenAreAsaba && h.sonsSon > 0) {
    give2to1("sonsSon", h.sonsSon, "sonsDaughter", h.sonsDaughter, "residuary, son's son and son's daughter share two to one");
    return true;
  }
  // 3. Father, then grandfather, as residuary (keeps any 1/6 already given).
  if (ctx.ascendant) {
    const prev = shares.get(ctx.ascendant);
    if (prev && prev.basis === "fard+asaba") {
      shares.set(ctx.ascendant, { frac: prev.frac.add(residue), basis: "fard+asaba", reason: "1/6 plus the residue as residuary" });
      return true;
    }
    if (!ctx.anyDescendant) {
      shares.set(ctx.ascendant, { frac: (prev?.frac ?? F0).add(residue), basis: "asaba", reason: "residuary, no descendant" });
      return true;
    }
  }
  // 4. Full brothers (2:1 with full sisters), or full sisters as residuary behind daughters.
  if (!ctx.ascendantBlocksSiblings && !ctx.maleDescendant) {
    if (h.fullBrother > 0) {
      give2to1("fullBrother", h.fullBrother, "fullSister", h.fullSister, "residuary, full brothers and sisters share two to one");
      return true;
    }
    const femaleDescendantTakesShare = !ctx.childrenAreAsaba && (h.daughter > 0 || h.sonsDaughter > 0);
    if (femaleDescendantTakesShare && h.fullSister > 0) {
      shares.set("fullSister", { frac: residue, basis: "asaba", reason: "residuary with the daughters (asaba maa al-ghayr)" });
      return true;
    }
    // 5. Paternal brothers (2:1), or paternal sisters as residuary behind daughters.
    if (h.fullBrother === 0) {
      if (h.paternalBrother > 0) {
        give2to1("paternalBrother", h.paternalBrother, "paternalSister", h.paternalSister, "residuary, paternal half-siblings share two to one");
        return true;
      }
      if (femaleDescendantTakesShare && h.fullSister === 0 && h.paternalSister > 0) {
        shares.set("paternalSister", { frac: residue, basis: "asaba", reason: "residuary with the daughters (asaba maa al-ghayr)" });
        return true;
      }
    }
  }
  return false;
}

function finalize(
  shares: Map<HeirKey, { frac: Fraction; basis: ShareLine["basis"]; reason: string }>,
  h: Record<HeirKey, number>,
  notes: string[],
  blocked: { heir: HeirKey; by: string }[],
  toTreasury: Fraction,
  awlApplied = false,
  raddApplied = false,
): MirathResult {
  const order = Object.keys(HEIR_LABELS) as HeirKey[];
  const lines: ShareLine[] = [];
  let total = F0;
  let lcm = 1;

  for (const k of order) {
    const s = shares.get(k);
    if (!s || s.frac.isZero()) continue;
    const count = h[k];
    lines.push({
      heir: k,
      count,
      fraction: s.frac,
      perHead: s.frac.div(f(Math.max(1, count))),
      basis: s.basis,
      reason: s.reason,
    });
    total = total.add(s.frac);
    lcm = (lcm * s.frac.d) / gcd(lcm, s.frac.d);
  }

  return {
    shares: lines,
    totalDistributed: total,
    baseDenominator: lcm,
    finalDenominator: total.d === 1 ? lcm : (lcm * total.d) / gcd(lcm, total.d),
    awlApplied,
    raddApplied,
    toTreasury,
    notes,
    blocked,
  };
}
