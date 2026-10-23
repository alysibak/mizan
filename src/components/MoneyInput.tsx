"use client";

import { decimalMarkFor, parseAmount, type CalcDraft } from "@/lib/calculator";
import { amountInWords } from "@/lib/number-words";

export function MoneyInput({
  id,
  label,
  currency,
  value,
  onChange,
  intl,
  decimal,
  currencyButton,
}: {
  id: string;
  label: string;
  currency: string;
  value: string;
  onChange: (v: string) => void;
  /** The page's number format; with it, a large amount is also said in words. */
  intl?: string;
  /** The decimal mark the amount was typed with, if not the page's own. */
  decimal?: CalcDraft["decimal"];
  /** Makes the currency in the box a button that changes it. */
  currencyButton?: { label: string; open: boolean; onClick: () => void };
}) {
  const words = intl ? amountInWords(parseAmount(value, decimal ?? decimalMarkFor(intl)), intl, currency) : null;
  return (
    <div>
      <label className="label mb-1.5" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        {currencyButton ? (
          <button
            type="button"
            className="absolute inset-y-0 start-0 z-10 flex items-center gap-1 border-e border-mist px-3 text-sm font-medium text-pine"
            aria-label={`${currencyButton.label}: ${currency}`}
            aria-expanded={currencyButton.open}
            onClick={currencyButton.onClick}
          >
            {currency}
            <span aria-hidden>▾</span>
          </button>
        ) : (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-xs text-sage">
            {currency}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          className={"field nums " + (currencyButton ? "ps-[5.25rem]" : "ps-12")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={words ? `${id}-words` : undefined}
        />
      </div>
      <AmountWords id={`${id}-words`} words={words} />
    </div>
  );
}

/** "= 25 lakh" under a money box, to catch a slipped zero. */
export function AmountWords({ id, words }: { id: string; words: string | null }) {
  if (!words) return null;
  return (
    <p id={id} className="mt-1 text-sm text-pine nums">
      {words.startsWith("≈") ? words : `= ${words}`}
    </p>
  );
}
