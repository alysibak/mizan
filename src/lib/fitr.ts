/**
 * Zakat al-Fitr: one fixed amount for each person you provide for, paid
 * before the Eid prayer. The amount is the price of one sa' of staple food,
 * which local councils announce each Ramadan in their currency, so it is
 * entered by hand rather than guessed here.
 */

import { toCents } from "./money";

export const MAX_FITR_PEOPLE = 50;

export interface FitrResult {
  valid: boolean;
  total: number;
  message: string;
}

export function zakatAlFitr(people: number, perPerson: number): FitrResult {
  if (!Number.isInteger(people) || people < 1 || people > MAX_FITR_PEOPLE) {
    return {
      valid: false,
      total: 0,
      message: `Count everyone you provide for: a whole number from 1 to ${MAX_FITR_PEOPLE}.`,
    };
  }
  if (!(perPerson > 0) || !Number.isFinite(perPerson)) {
    return {
      valid: false,
      total: 0,
      message: "Enter the per-person amount your mosque or council announced.",
    };
  }
  return {
    valid: true,
    total: toCents(people * perPerson),
    message: `${people} ${people === 1 ? "person" : "people"} × the announced amount.`,
  };
}

/** Where the Zakat al-Fitr page keeps the household in the browser. */
export const FITR_KEY = "mizan-fitr-v1";

export interface FitrState {
  people: string;
  perPerson: string;
}

export function parseFitr(raw: string | null): FitrState {
  try {
    const v = raw ? (JSON.parse(raw) as Partial<Record<keyof FitrState, unknown>>) : {};
    const text = (x: unknown, fallback: string) => (typeof x === "string" ? x.slice(0, 20) : fallback);
    return { people: text(v.people, "1"), perPerson: text(v.perPerson, "") };
  } catch {
    return { people: "1", perPerson: "" };
  }
}
