/**
 * Bank interest set aside to be given away. It is not zakat and is not
 * counted in it; My zakat reminds the visitor until it has been given.
 */
export const INTEREST_KEY = "mizan-interest-v1";

export interface InterestState {
  balance: string;
  interest: string;
  /** Ticked once it has been given away. */
  given: boolean;
}

export const EMPTY_INTEREST: InterestState = { balance: "", interest: "", given: false };

export function parseInterest(raw: string | null): InterestState {
  if (!raw) return EMPTY_INTEREST;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof InterestState, unknown>>;
    const text = (x: unknown) => (typeof x === "string" ? x.slice(0, 40) : "");
    return { balance: text(v.balance), interest: text(v.interest), given: v.given === true };
  } catch {
    return EMPTY_INTEREST;
  }
}
