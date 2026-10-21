/**
 * Prompts for wealth people commonly forget at zakat time.
 * Not exhaustive, not a fatwa — a memory aid for the ledger.
 */

export interface ForgottenPrompt {
  id: string;
  label: string;
  hint: string;
  /** Suggested ledger category if they add it. */
  categoryHint?: string;
}

export const FORGOTTEN_PROMPTS: ForgottenPrompt[] = [
  {
    id: "wedding_gold",
    label: "Wedding or family gold at home",
    hint: "Even if you rarely wear it. Your madhhab decides how much of it counts.",
    categoryHint: "jewellery",
  },
  {
    id: "kids_accounts",
    label: "Children’s accounts in your name",
    hint: "If you control the money, many count it as yours.",
    categoryHint: "bank",
  },
  {
    id: "security_deposits",
    label: "Rent or utility deposits you expect back",
    hint: "Often overlooked cash that is still yours.",
    categoryHint: "receivables",
  },
  {
    id: "gift_cards",
    label: "Store credit and gift cards",
    hint: "Money you can spend is still yours, even in another pocket.",
    categoryHint: "other",
  },
  {
    id: "crypto_dust",
    label: "Small crypto or exchange leftovers",
    hint: "Small amounts in old wallets add up.",
    categoryHint: "crypto",
  },
  {
    id: "employer_shares",
    label: "Shares from work",
    hint: "Check your work benefits, not only your bank.",
    categoryHint: "stocks_longterm",
  },
  {
    id: "loans_out",
    label: "Money friends or family still owe you",
    hint: "Money you expect back usually counts; money you may never get can wait.",
    categoryHint: "receivables",
  },
  {
    id: "business_float",
    label: "Shop cash or stock you keep apart from your own money",
    hint: "Goods for sale and cash in the till still count.",
    categoryHint: "business_inventory",
  },
  {
    id: "foreign_account",
    label: "An account abroad or in another currency",
    hint: "Use a rate you trust, and note where it came from.",
    categoryHint: "bank",
  },
  {
    id: "refunds_pending",
    label: "Tax refunds or insurance payouts already approved",
    hint: "If the amount is certain and yours, add it to what you own.",
    categoryHint: "receivables",
  },
];
