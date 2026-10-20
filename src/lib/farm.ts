/**
 * Zakat on what a farm produces: crops at harvest, and grazing animals
 * after a year. The crop rates and nisab follow the hadith of Ibn ‘Umar and
 * Abu Sa‘id; the animal tables follow the letter of Abu Bakr (camels, sheep
 * and goats) and the hadith of Mu‘adh (cattle), as the majority read them.
 */

/** How the land was watered, which sets the share. */
export type Watering = "rain" | "irrigated" | "both";

export const CROP_RATE: Record<Watering, number> = {
  // Rain, rivers, springs: a tenth.
  rain: 0.1,
  // Watered by your own effort or cost (pump, well, bought water): half a tenth.
  irrigated: 0.05,
  // Half and half: three quarters of a tenth.
  both: 0.075,
};

/**
 * Five awsuq (300 sa‘) of grain, about 653 kg of wheat by a common modern
 * estimate; others put it between about 600 and 700 kg.
 */
export const CROP_NISAB_KG = 653;

/** A maund (mann) as weighed in Pakistan and India. */
export const MAUND_KG = 40;

export interface CropResult {
  /** Whether the harvest reaches the nisab. */
  due: boolean;
  rate: number;
  /** The share to give, in kg, rounded to a tenth. */
  kg: number;
}

export function cropZakat(harvestKg: number, watering: Watering, nisabKg = CROP_NISAB_KG): CropResult {
  const rate = CROP_RATE[watering];
  if (!Number.isFinite(harvestKg) || harvestKg <= 0 || harvestKg < nisabKg) return { due: false, rate, kg: 0 };
  return { due: true, rate, kg: Math.round(harvestKg * rate * 10) / 10 };
}

export type Herd = "sheep" | "cattle" | "camels";

/** What is given, by its age, in the words of the hadith. */
export type Given =
  | "sheep" // a sheep or goat
  | "tabi" // a calf in its second year
  | "musinnah" // a cow in its third year
  | "bintMakhad" // a she-camel in its second year
  | "bintLabun" // a she-camel in its third year
  | "hiqqah" // a she-camel in its fourth year
  | "jadhaah"; // a she-camel in its fifth year

export interface Due {
  given: Given;
  count: number;
}

/** The fewest animals a herd needs before anything is due. */
export const HERD_NISAB: Record<Herd, number> = { sheep: 40, cattle: 30, camels: 5 };

/**
 * Split a count, taken down to the nearest ten, into groups of `small` and
 * `large` (30 and 40 for cattle, 40 and 50 for camels), using as many large
 * groups as possible, since the older animal is the better gift.
 */
function groups(n: number, small: number, large: number): { small: number; large: number } {
  const tens = Math.floor(n / 10) * 10;
  for (let l = Math.floor(tens / large); l >= 0; l--) {
    const rest = tens - l * large;
    if (rest % small === 0) return { small: rest / small, large: l };
  }
  return { small: 0, large: 0 };
}

function list(...dues: Due[]): Due[] {
  return dues.filter((d) => d.count > 0);
}

/** What a herd of `n` grazing animals owes after a year, or nothing. */
export function herdZakat(herd: Herd, count: number): Due[] {
  const n = Number.isFinite(count) ? Math.floor(count) : 0;
  if (n < HERD_NISAB[herd]) return [];
  if (herd === "sheep") {
    if (n <= 120) return list({ given: "sheep", count: 1 });
    if (n <= 200) return list({ given: "sheep", count: 2 });
    if (n < 400) return list({ given: "sheep", count: 3 });
    return list({ given: "sheep", count: Math.floor(n / 100) });
  }
  if (herd === "cattle") {
    if (n < 40) return list({ given: "tabi", count: 1 });
    if (n < 60) return list({ given: "musinnah", count: 1 });
    const g = groups(n, 30, 40);
    return list({ given: "musinnah", count: g.large }, { given: "tabi", count: g.small });
  }
  if (n < 25) return list({ given: "sheep", count: Math.floor(n / 5) });
  if (n <= 35) return list({ given: "bintMakhad", count: 1 });
  if (n <= 45) return list({ given: "bintLabun", count: 1 });
  if (n <= 60) return list({ given: "hiqqah", count: 1 });
  if (n <= 75) return list({ given: "jadhaah", count: 1 });
  if (n <= 90) return list({ given: "bintLabun", count: 2 });
  if (n <= 120) return list({ given: "hiqqah", count: 2 });
  const g = groups(n, 40, 50);
  return list({ given: "hiqqah", count: g.large }, { given: "bintLabun", count: g.small });
}

/** The steps of each table, for drawing it with the reader's row lit. */
export const HERD_STEPS: Record<Herd, { from: number; to: number | null; dues: Due[] }[]> = {
  sheep: [
    { from: 40, to: 120, dues: [{ given: "sheep", count: 1 }] },
    { from: 121, to: 200, dues: [{ given: "sheep", count: 2 }] },
    { from: 201, to: 399, dues: [{ given: "sheep", count: 3 }] },
    { from: 400, to: null, dues: [{ given: "sheep", count: 1 }] },
  ],
  cattle: [
    { from: 30, to: 39, dues: [{ given: "tabi", count: 1 }] },
    { from: 40, to: 59, dues: [{ given: "musinnah", count: 1 }] },
    { from: 60, to: null, dues: [{ given: "tabi", count: 1 }, { given: "musinnah", count: 1 }] },
  ],
  camels: [
    { from: 5, to: 24, dues: [{ given: "sheep", count: 1 }] },
    { from: 25, to: 35, dues: [{ given: "bintMakhad", count: 1 }] },
    { from: 36, to: 45, dues: [{ given: "bintLabun", count: 1 }] },
    { from: 46, to: 60, dues: [{ given: "hiqqah", count: 1 }] },
    { from: 61, to: 75, dues: [{ given: "jadhaah", count: 1 }] },
    { from: 76, to: 90, dues: [{ given: "bintLabun", count: 2 }] },
    { from: 91, to: 120, dues: [{ given: "hiqqah", count: 2 }] },
    { from: 121, to: null, dues: [{ given: "bintLabun", count: 1 }, { given: "hiqqah", count: 1 }] },
  ],
};

/** Which step of the table a herd of `n` is on, or -1 below the nisab. */
export function herdStep(herd: Herd, n: number): number {
  return HERD_STEPS[herd].findIndex((s) => n >= s.from && (s.to === null || n <= s.to));
}

/** Where the farm page keeps its figures in the browser. */
export const FARM_KEY = "mizan-farm-v1";

export interface FarmState {
  harvest: string;
  unit: "kg" | "maund";
  watering: Watering;
  counts: Record<Herd, string>;
  grazing: boolean;
}

export const EMPTY_FARM: FarmState = {
  harvest: "",
  unit: "kg",
  watering: "rain",
  counts: { sheep: "", cattle: "", camels: "" },
  grazing: true,
};

/** What the farm page kept, or an empty farm if nothing (or nonsense) was. */
export function parseFarm(raw: string | null): FarmState {
  if (!raw) return EMPTY_FARM;
  try {
    const v = JSON.parse(raw) as Partial<FarmState> & { counts?: Partial<Record<Herd, unknown>> };
    const text = (x: unknown) => (typeof x === "string" ? x.slice(0, 20) : "");
    return {
      harvest: text(v.harvest),
      unit: v.unit === "maund" ? "maund" : "kg",
      watering: v.watering === "irrigated" || v.watering === "both" ? v.watering : "rain",
      counts: { sheep: text(v.counts?.sheep), cattle: text(v.counts?.cattle), camels: text(v.counts?.camels) },
      grazing: v.grazing !== false,
    };
  } catch {
    return EMPTY_FARM;
  }
}

/** Crops and herds that owe something, for My zakat. */
export function farmDues(state: FarmState, parse: (raw: string) => number): { cropKg: number; herds: { herd: Herd; dues: Due[] }[] } {
  const kg = parse(state.harvest) * (state.unit === "maund" ? MAUND_KG : 1);
  const crop = cropZakat(kg, state.watering);
  const herds = state.grazing
    ? (["sheep", "cattle", "camels"] as const)
        .map((herd) => ({ herd, dues: herdZakat(herd, Math.floor(parse(state.counts[herd]))) }))
        .filter((h) => h.dues.length > 0)
    : [];
  return { cropKg: crop.due ? crop.kg : 0, herds };
}
