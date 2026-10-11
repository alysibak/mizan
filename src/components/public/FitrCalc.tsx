"use client";

import { useState } from "react";
import Link from "next/link";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { MAX_FITR_PEOPLE, zakatAlFitr } from "@/lib/fitr";
import { formatMoney } from "@/lib/money";
import { LOCALE_INFO, fmt, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

/** Zakat al-Fitr for a household, for a visitor without an account, in their language. */
export default function FitrCalc({
  m,
  currencyLabel,
  locale,
}: {
  m: Messages["fitr"];
  currencyLabel: string;
  locale: Locale;
}) {
  const intl = LOCALE_INFO[locale].intl;
  const [currency, setCurrency] = useVisitorCurrency();
  const [people, setPeople] = useState("1");
  const [perPerson, setPerPerson] = useState("");
  const count = parseInt(people, 10) || 0;
  const amount = parseFloat(perPerson) || 0;
  const result = zakatAlFitr(count, amount);
  const money = (n: number) => formatMoney(n, currency, intl);
  const countOk = Number.isInteger(count) && count >= 1 && count <= MAX_FITR_PEOPLE;

  return (
    <div className="space-y-6">
      <section className="card space-y-5 p-5 sm:p-6">
        <div className="sm:max-w-xs">
          <CurrencySelect
            value={currency}
            onChange={setCurrency}
            label={currencyLabel}
            locale={locale}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5" htmlFor="people">
              {m.people}
            </label>
            <input
              id="people"
              type="number"
              inputMode="numeric"
              min="1"
              max={MAX_FITR_PEOPLE}
              step="1"
              className="field text-lg nums"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-sage">{m.peopleHint}</p>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="perPerson">
              {fmt(m.perPerson, { currency })}
            </label>
            <input
              id="perPerson"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              className="field text-lg nums"
              placeholder="0.00"
              value={perPerson}
              onChange={(e) => setPerPerson(e.target.value)}
            />
            <p className="mt-1.5 text-xs leading-relaxed text-sage">{m.perPersonHint}</p>
          </div>
        </div>

        <div
          aria-live="polite"
          className={"border px-4 py-4 " + (result.valid ? "border-pine/30 bg-pine/5" : "border-mist")}
        >
          {result.valid ? (
            <>
              <p className="label text-pine">{m.total}</p>
              <p className="mt-1 font-serif text-3xl text-pine nums">{money(result.total)}</p>
              <p className="mt-1 text-sm text-sage nums">
                {fmt(m.line, { people: count, amount: money(amount) })}
              </p>
            </>
          ) : (
            <p className="text-sm text-sage">
              {countOk ? m.needAmount : fmt(m.needPeople, { max: MAX_FITR_PEOPLE })}
            </p>
          )}
        </div>

        {result.valid ? (
          <p className="text-sm leading-relaxed text-sage">
            <Link href="/register" className="font-medium text-pine hover:underline">
              {m.ledgerLink}
            </Link>{" "}
            {m.ledgerRest}
          </p>
        ) : null}
      </section>
      <p className="text-xs leading-relaxed text-sage">{m.schools}</p>
    </div>
  );
}
