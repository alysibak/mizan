"use client";

import { useState } from "react";
import Link from "next/link";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { useMetalPrices } from "@/components/public/useMetalPrices";
import { MoneyInput } from "@/components/ZakatCalculator";
import { decimalMarkFor, parseAmount } from "@/lib/calculator";
import { formatMoney } from "@/lib/money";
import { ZAKAT_RATE_LUNAR } from "@/lib/zakat";
import { LOCALE_INFO, fmt, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

/**
 * The home page's first thirty seconds: one number, and the answer appears
 * as it is typed, against today's silver nisab. The exact answer, with
 * debts, jewellery and the year, is one tap away in the guide.
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
  const prices = useMetalPrices(currency);
  const intl = LOCALE_INFO[locale].intl;
  const value = parseAmount(amount, decimalMarkFor(intl));
  const nisab = prices.nisab.silver;
  const money = (n: number) => formatMoney(n, currency, intl);
  const due = value >= nisab && nisab > 0;

  return (
    <section aria-label={m.label} className="card space-y-4 p-5 sm:p-6">
      <div>
        <MoneyInput id="quick-amount" label={m.label} currency={currency} value={amount} onChange={setAmount} intl={intl} />
        {/* The currency is guessed from the phone; changing it is one tap, out of the way. */}
        <button
          type="button"
          className="mt-2 text-sm text-pine underline underline-offset-2"
          aria-expanded={picking}
          aria-label={`${m.currency}: ${currency}`}
          onClick={() => setPicking((p) => !p)}
        >
          {currency} ▾
        </button>
        {picking ? (
          <div className="mt-2 max-w-xs">
            <CurrencySelect id="quick-currency" value={currency} onChange={setCurrency} label={m.currency} locale={locale} />
          </div>
        ) : null}
      </div>

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

      <Link href={guideHref} className="btn-primary w-full justify-between px-5 py-3 text-base sm:w-auto">
        <span>{m.exact}</span>
        <span aria-hidden className="ms-4 rtl:rotate-180">
          →
        </span>
      </Link>
    </section>
  );
}
