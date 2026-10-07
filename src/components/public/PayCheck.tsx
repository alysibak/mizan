"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { useHydrated } from "@/lib/client-store";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "@/lib/nisab";
import { formatMoney } from "@/lib/money";
import { LOCALE_INFO, fmt, localePath, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

type Answer = "yes" | "no" | "unsure";
type Nisab = { currency: string; silver: number; gold: number } | { currency: string; error: true };

/**
 * "Do I have to pay zakat?" in three yes-or-no questions, with today's nisab
 * in the visitor's currency. Nothing is stored except the currency choice.
 */
export default function PayCheck({ m, locale }: { m: Messages["start"]; locale: Locale }) {
  const hydrated = useHydrated();
  const [currency, setCurrency] = useVisitorCurrency();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [nisab, setNisab] = useState<Nisab | null>(null);
  const intl = LOCALE_INFO[locale].intl;

  useEffect(() => {
    if (!hydrated) return;
    let current = true;
    fetch(`/api/metals?currency=${encodeURIComponent(currency)}`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data: { goldPricePerGram?: number; silverPricePerGram?: number } | null) => {
        if (!current) return;
        setNisab(
          data?.silverPricePerGram && data.goldPricePerGram
            ? {
                currency,
                silver: NISAB_SILVER_GRAMS * data.silverPricePerGram,
                gold: NISAB_GOLD_GRAMS * data.goldPricePerGram,
              }
            : { currency, error: true },
        );
      });
    return () => {
      current = false;
    };
  }, [currency, hydrated]);

  const known = nisab && nisab.currency === currency && !("error" in nisab) ? nisab : null;
  // Whole amounts: "more than PKR 243,950" reads more easily than with paisa.
  const money = (n: number) => {
    try {
      return new Intl.NumberFormat(intl, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(n));
    } catch {
      return formatMoney(n, currency, intl);
    }
  };

  function answer(step: number, value: Answer) {
    setAnswers((a) => [...a.slice(0, step), value]);
  }

  // Where the answers so far lead: another question, or an outcome.
  const [a1, a2, a3] = answers;
  let outcome: "no" | "notYet" | "yes" | "unsure" | null = null;
  if (a1 === "no" || a2 === "no") outcome = "no";
  else if (a1 === "unsure" || a2 === "unsure" || a3 === "unsure") outcome = "unsure";
  else if (a3 === "no") outcome = "notYet";
  else if (a3 === "yes") outcome = "yes";

  const questions: { text: string; hint: string }[] = [
    { text: m.q1, hint: m.q1Hint },
    {
      text: known ? fmt(m.q2, { amount: money(known.silver) }) : m.q2NoPrice,
      hint: fmt(m.q2Hint, { gold: known ? money(known.gold) : `${NISAB_GOLD_GRAMS} g` }),
    },
    { text: m.q3, hint: m.q3Hint },
  ];
  const shown = outcome ? answers.length : Math.min(answers.length + 1, questions.length);
  const calculator = `${localePath(locale, "/calculator")}?currency=${currency}`;

  return (
    <div className="card p-5 sm:p-7">
      <div className="max-w-xs">
        <CurrencySelect
          id="check-currency"
          label={m.showIn}
          value={currency}
          onChange={setCurrency}
          locale={locale}
        />
      </div>

      <ol className="mt-6 space-y-6">
        {questions.slice(0, shown).map((q, step) => (
          <li key={step} className="border-t border-mist pt-5">
            <fieldset>
              <legend className="font-serif text-xl leading-snug text-ink">
                <span className="text-brassDeep nums">{step + 1}. </span>
                {q.text}
              </legend>
              <p className="mt-1 text-sm leading-relaxed text-sage">{q.hint}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    ["yes", m.yes],
                    ["no", m.no],
                    ["unsure", m.notSure],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={answers[step] === value}
                    onClick={() => answer(step, value)}
                    className={
                      "min-h-[48px] min-w-[6rem] border px-5 text-base transition " +
                      (answers[step] === value
                        ? "border-pine bg-pine text-porcelain"
                        : "border-mist bg-paper text-ink hover:border-sage")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div aria-live="polite">
        {outcome ? (
          <div
            className={
              "mt-6 border px-5 py-5 " +
              (outcome === "yes" ? "border-pine bg-pine/5" : "border-mist bg-paper")
            }
          >
            <p className="font-serif text-2xl text-ink">
              {outcome === "yes"
                ? m.yesTitle
                : outcome === "no"
                  ? m.noTitle
                  : outcome === "notYet"
                    ? m.notYetTitle
                    : m.unsureTitle}
            </p>
            <p className="mt-2 leading-relaxed text-sage">
              {outcome === "yes"
                ? m.yesBody
                : outcome === "no"
                  ? m.noBody
                  : outcome === "notYet"
                    ? m.notYetBody
                    : m.unsureBody}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {outcome === "no" ? null : outcome === "notYet" ? (
                <Link href="/register" className="btn-primary px-5 py-3 text-base">
                  {m.ctaYear}
                </Link>
              ) : (
                <Link href={calculator} className="btn-primary px-5 py-3 text-base">
                  {m.ctaCalculate}
                </Link>
              )}
              <button
                type="button"
                className="text-sm text-pine underline-offset-2 hover:underline"
                onClick={() => setAnswers([])}
              >
                {m.startAgain}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
