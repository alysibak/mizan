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
    label: "Wedding or heirloom gold at home",
    hint: "Even if rarely worn — weigh and decide the portion with your school profile.",
    categoryHint: "jewellery",
  },
  {
    id: "kids_accounts",
    label: "Children’s accounts in your name",
    hint: "If you control the funds, many count them on your ledger.",
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
    label: "Store credit / gift cards",
    hint: "Spendable balances are wealth in another pocket.",
    categoryHint: "other",
  },
  {
    id: "crypto_dust",
    label: "Small crypto or exchange leftovers",
    hint: "Dust across wallets adds up at market value.",
    categoryHint: "crypto",
  },
  {
    id: "employer_shares",
    label: "Vested shares or ESPP not in your brokerage app",
    hint: "Check the benefits portal, not only the bank.",
    categoryHint: "stocks_longterm",
  },
  {
    id: "loans_out",
    label: "Money friends or family still owe you",
    hint: "Expected recovery is often zakatable; doubtful debts may wait.",
    categoryHint: "receivables",
  },
  {
    id: "business_float",
    label: "Till cash or inventory you “don’t count as personal”",
    hint: "Trade goods and float are still on the scale for many.",
    categoryHint: "business_inventory",
  },
  {
    id: "foreign_account",
    label: "An account abroad or in another currency",
    hint: "Convert at a rate you trust; note the source in the holding.",
    categoryHint: "bank",
  },
  {
    id: "refunds_pending",
    label: "Tax refunds or insurance payouts already approved",
    hint: "If the amount is certain and yours, it may belong on the ledger.",
    categoryHint: "receivables",
  },
];
