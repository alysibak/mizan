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
