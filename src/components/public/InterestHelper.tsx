"use client";

import { useState } from "react";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { MoneyInput } from "@/components/ZakatCalculator";
import { parseAmount } from "@/lib/calculator";
import { formatMoney } from "@/lib/money";

const INTL = "en-CA";

/**
 * Interest a bank paid you, separated from your own money: the savings stay
 * yours and count for zakat; the interest is given away, and is neither
 * zakat nor counted in it. Nothing is stored or sent.
 */
export default function InterestHelper() {
  const [currency, setCurrency] = useVisitorCurrency();
  const [balance, setBalance] = useState("");
  const [interest, setInterest] = useState("");
  const money = (n: number) => formatMoney(n, currency, INTL);
  const total = parseAmount(balance, ".");
  const paid = Math.min(parseAmount(interest, "."), total || Infinity);
  const yours = Math.max(0, total - paid);
  const share = total > 0 ? paid / total : 0;

  return (
    <section className="card space-y-5 p-5 sm:p-6" aria-labelledby="interest-title">
      <h2 id="interest-title" className="font-serif text-2xl text-ink">
        Separate it from your money
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <CurrencySelect value={currency} onChange={setCurrency} label="Currency" />
        <MoneyInput
          id="interest-balance"
          label="What the account holds now"
          currency={currency}
          value={balance}
          onChange={setBalance}
          intl={INTL}
          decimal="."
        />
        <MoneyInput
          id="interest-paid"
          label="Interest it has paid you"
          currency={currency}
          value={interest}
          onChange={setInterest}
          intl={INTL}
          decimal="."
        />
      </div>
      <p className="text-xs text-sage">
        On a statement it may be called “interest” or “credit interest”. Profit from a genuine Islamic account is
        not interest.
      </p>

      {paid > 0 ? (
        <div className="space-y-4 border-t border-mist pt-4" aria-live="polite">
          {total > 0 ? (
            <div>
              <div className="flex h-8 overflow-hidden border border-mist" aria-hidden>
                <div className="h-full bg-pine" style={{ width: `${(1 - share) * 100}%` }} />
                <div
                  className="h-full bg-danger/80"
                  style={{ width: `${Math.max(share * 100, 2)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between gap-3 text-sm">
                <span>
                  <span className="block text-sage">Yours</span>
                  <span className="font-medium text-pine nums">{money(yours)}</span>
                </span>
                <span className="text-end">
                  <span className="block text-sage">Interest</span>
                  <span className="font-medium text-danger nums">{money(paid)}</span>
                </span>
              </div>
            </div>
          ) : null}
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger/90 text-sm font-medium text-surface" aria-hidden>
                1
              </span>
              <p className="text-base text-ink">
                Give away <strong className="font-medium nums">{money(paid)}</strong>: to the poor, or to public good
                like a well or a road. Hope for no reward; you are getting rid of it.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-medium text-surface" aria-hidden>
                2
              </span>
              <p className="text-base text-ink">
                It is <strong className="font-medium">not your zakat</strong>, and does not count towards it. Your zakat
                comes from your own money.
              </p>
            </li>
            {total > 0 ? (
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-medium text-surface" aria-hidden>
                  3
                </span>
                <p className="text-base text-ink">
                  When you work out your zakat, count <strong className="font-medium nums">{money(yours)}</strong> from
                  this account, not {money(total)}.
                </p>
              </li>
            ) : null}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
