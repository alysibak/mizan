"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { useMetalPrices } from "@/components/public/useMetalPrices";
import { MoneyInput } from "@/components/MoneyInput";
import { BalanceScale } from "@/components/public/BalanceScale";
import {
  CALC_STORAGE_KEY,
  FROM_HOME_KEY,
  decimalMarkFor,
  draftIsEmpty,
  emptyDraft,
  parseAmount,
  parseDraft,
} from "@/lib/calculator";
import { setStoredValue, useStoredValue } from "@/lib/client-store";
import { formatMoney } from "@/lib/money";
import { countStep } from "@/lib/analytics";
import { ZAKAT_RATE_LUNAR } from "@/lib/zakat";
import { LOCALE_INFO, fmt, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

/**
 * The home page's first thirty seconds: one number, and the answer appears
 * as it is typed, against today's silver nisab. The exact answer, with
 * debts, jewellery and the year, is one tap away in the guide, which starts
 * from this number instead of asking for it again.
 */
export default function QuickAnswer({
  m,
  locale,
  guideHref,
}: {
  m: Messages["landing"]["quick"];
  locale: Locale;
  guideHref: string;
}) {
  const [currency, setCurrency] = useVisitorCurrency();
  const [amount, setAmount] = useState("");
  const [picking, setPicking] = useState(false);
  useEffect(() => countStep("home"), []);
  const prices = useMetalPrices(currency);
  const stored = parseDraft(useStoredValue(CALC_STORAGE_KEY));
  const intl = LOCALE_INFO[locale].intl;
  const decimal = decimalMarkFor(intl);
  const value = parseAmount(amount, decimal);
  const nisab = prices.nisab.silver;
  // An estimate from one number: whole money reads faster than cents.
  const money = (n: number) => formatMoney(n, currency, intl, { whole: true });
  const due = value >= nisab && nisab > 0;
  // Figures already worked out on this phone are theirs, and are not replaced.
  const carry = value > 0 && (stored === null || draftIsEmpty(stored));

  function carryOver() {
    if (!carry) return;
    const draft = emptyDraft(currency, decimal);
    setStoredValue(CALC_STORAGE_KEY, JSON.stringify({ ...draft, amounts: { cash: amount } }));
    // Tells the guide, in this tab only, that the number came from here.
    try {
      sessionStorage.setItem(FROM_HOME_KEY, "1");
    } catch {
      /* private mode: the guide still has the number, only not the line about it */
    }
  }

  return (
    <section aria-label={m.label} className="card space-y-4 p-5 sm:p-6">
      <div>
        <MoneyInput
          id="quick-amount"
          label={m.label}
          currency={currency}
          value={amount}
          onChange={(v) => {
            setAmount(v);
            if (parseAmount(v, decimal) > 0) countStep("typed");
          }}
          intl={intl}
          currencyButton={{ label: m.currency, open: picking, onClick: () => setPicking((p) => !p) }}
        />
        {picking ? (
          <div className="mt-2 max-w-xs">
            <CurrencySelect
              id="quick-currency"
              value={currency}
              onChange={(code) => {
                setCurrency(code);
                setPicking(false);
              }}
              label={m.currency}
              locale={locale}
            />
          </div>
        ) : null}
      </div>

      {/* The balance tips as the number is typed: their savings against the minimum. */}
      {value > 0 && nisab > 0 ? (
        <div className="w-44">
          <BalanceScale net={value} nisab={nisab} money={money} labels={{ you: "", nisab: "" }} bare />
        </div>
      ) : null}

      <div aria-live="polite" className="min-h-[3.5rem]">
        {!(nisab > 0) ? null : !(value > 0) ? (
          <p className="text-base text-sage">{fmt(m.nisab, { nisab: money(nisab) })}</p>
        ) : due ? (
          <>
            <p className="font-serif text-3xl text-pine nums">{fmt(m.due, { zakat: money(value * ZAKAT_RATE_LUNAR) })}</p>
            <p className="mt-1 text-sm text-sage">{fmt(m.dueHint, { amount: money(value) })}</p>
          </>
        ) : (
          <p className="text-lg text-ink">{fmt(m.below, { nisab: money(nisab) })}</p>
        )}
      </div>

      <Link
        href={guideHref}
        onClick={carryOver}
        className="btn-primary w-full justify-between px-5 py-3 text-base sm:w-auto"
      >
        <span>{m.exact}</span>
        <span aria-hidden className="ms-4 rtl:rotate-180">
          →
        </span>
      </Link>
    </section>
  );
}
