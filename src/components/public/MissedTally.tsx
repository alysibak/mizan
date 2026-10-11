"use client";

import { setStoredValue, useStoredValue } from "@/lib/client-store";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { Choice, GivenTracker, MoneyInput } from "@/components/ZakatCalculator";
import { decimalMarkFor, parseAmount } from "@/lib/calculator";
import { MAX_MISSED_YEARS, PLAN_MONTHS, missedZakat } from "@/lib/missed";
import { formatMoney } from "@/lib/money";
import { LOCALE_INFO, fmt, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

/** "Last year", "2 years ago", in the page's language. */
function yearsAgo(n: number, intl: string): string {
  const text = new Intl.RelativeTimeFormat(intl, { numeric: "auto" }).format(-n, "year");
  return text.charAt(0).toLocaleUpperCase(intl) + text.slice(1);
}

/** "6 months", in the page's language and its plural rules. */
function monthsText(n: number, intl: string): string {
  try {
    return new Intl.NumberFormat(intl, { style: "unit", unit: "month", unitDisplay: "long" }).format(n);
  } catch {
    return String(n);
  }
}

const KEY = "mizan-missed-v1";

interface Tally {
  years: string;
  same: string;
  different: boolean;
  each: string[];
  months: number;
  given: string;
}

const EMPTY: Tally = { years: "", same: "", different: false, each: [], months: 1, given: "" };

/** What was kept in this browser, or a fresh tally if nothing (or nonsense) was. */
function parseTally(raw: string | null): Tally {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof Tally, unknown>>;
    const text = (x: unknown) => (typeof x === "string" ? x.slice(0, 40) : "");
    return {
      years: text(v.years),
      same: text(v.same),
      different: v.different === true,
      each: Array.isArray(v.each) ? v.each.slice(0, MAX_MISSED_YEARS).map(text) : [],
      months: (PLAN_MONTHS as readonly unknown[]).includes(v.months) ? (v.months as number) : 1,
      given: text(v.given),
    };
  } catch {
    return EMPTY;
  }
}

/**
 * Zakat missed in past years, from rough amounts: one figure for every year,
 * or one per year, and a monthly plan to pay it off. Kept in this browser only,
 * so someone paying over months can come back and note what they have given.
 */
export default function MissedTally({
  m,
  calc,
  locale,
}: {
  m: Messages["missed"];
  calc: Messages["calc"];
  locale: Locale;
}) {
  const intl = LOCALE_INFO[locale].intl;
  const decimal = decimalMarkFor(intl);
  const [currency, setCurrency] = useVisitorCurrency();
  const tally = parseTally(useStoredValue(KEY));
  const { years, same, different, each, months, given } = tally;
  const update = (patch: Partial<Tally>) => setStoredValue(KEY, JSON.stringify({ ...tally, ...patch }));

  const count = Number(years);
  const countOk = Number.isInteger(count) && count >= 1 && count <= MAX_MISSED_YEARS;
  const amounts = countOk
    ? Array.from({ length: count }, (_, i) => parseAmount(different ? (each[i] ?? "") : same, decimal))
    : [];
  const result = missedZakat(amounts, months);
  const money = (n: number) => formatMoney(n, currency, intl);

  function showDifferent() {
    update({ different: true, each: Array.from({ length: MAX_MISSED_YEARS }, (_, i) => each[i] || same) });
  }

  return (
    <section className="card space-y-6 p-5 sm:p-6" aria-labelledby="tally">
      <h2 id="tally" className="font-serif text-2xl text-ink">
        {m.tallyTitle}
      </h2>
      <div className="sm:max-w-xs">
        <CurrencySelect value={currency} onChange={setCurrency} label={calc.currency} locale={locale} />
      </div>

      <div className="sm:max-w-xs">
        <label className="label mb-1.5" htmlFor="missed-years">
          {m.yearsLabel}
        </label>
        <input
          id="missed-years"
          type="number"
          inputMode="numeric"
          min="1"
          max={MAX_MISSED_YEARS}
          step="1"
          className="field text-lg nums"
          value={years}
          onChange={(e) => update({ years: e.target.value })}
        />
        <p className="mt-1.5 text-xs leading-relaxed text-sage">{m.yearsHint}</p>
      </div>

      {different ? (
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-sage">{m.eachHint}</p>
          {countOk ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {amounts.map((_, i) => (
                <li key={i} className="flex items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <MoneyInput
                      id={`missed-year-${i + 1}`}
                      label={yearsAgo(i + 1, intl)}
                      currency={currency}
                      value={each[i] ?? ""}
                      onChange={(v) =>
                        update({
                          each: Array.from({ length: MAX_MISSED_YEARS }, (_, j) => (j === i ? v : (each[j] ?? ""))),
                        })
                      }
                    />
                  </div>
                  <span className="pb-2.5 text-sm text-sage nums" aria-hidden>
                    {result.valid ? money(result.perYear[i]) : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" className="text-sm font-medium text-pine hover:underline" onClick={() => update({ different: false })}>
            {m.sameButton}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="sm:max-w-xs">
            <MoneyInput
              id="missed-same"
              label={fmt(m.sameLabel, { currency })}
              currency={currency}
              value={same}
              onChange={(v) => update({ same: v })}
            />
          </div>
          <p className="text-xs leading-relaxed text-sage">{m.sameHint}</p>
          <button type="button" className="text-sm font-medium text-pine hover:underline" onClick={showDifferent}>
            {m.differentButton}
          </button>
        </div>
      )}

      <fieldset>
        <legend className="label mb-2">{m.planLabel}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PLAN_MONTHS.map((n) => (
            <Choice
              key={n}
              name="missed-plan"
              checked={months === n}
              onChange={() => update({ months: n })}
              title={n === 1 ? m.planNow : fmt(m.planOver, { months: monthsText(n, intl) })}
            />
          ))}
        </div>
      </fieldset>

      <div
        aria-live="polite"
        className={"border px-4 py-4 " + (result.valid ? "border-pine/30 bg-pine/5" : "border-mist")}
      >
        {result.valid ? (
          <>
            <p className="label text-pine">{m.total}</p>
            <p className="mt-1 font-serif text-3xl text-pine nums">{money(result.total)}</p>
            <p className="mt-1 text-sm text-sage">{m.line}</p>
            {months > 1 ? (
              <p className="mt-3 text-base font-medium text-ink nums">
                {fmt(m.perMonth, { amount: money(result.perMonth), months: monthsText(months, intl) })}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-sage">{countOk ? m.needAmount : fmt(m.needYears, { max: MAX_MISSED_YEARS })}</p>
        )}
      </div>

      {result.valid ? (
        <GivenTracker
          id="missed-given"
          due={result.total}
          value={given}
          decimal={decimal}
          currency={currency}
          money={money}
          onChange={(v) => update({ given: v })}
          m={calc}
        />
      ) : null}

      {years || same || given ? (
        <button
          type="button"
          className="text-sm text-sage underline-offset-2 hover:text-ink hover:underline"
          onClick={() => {
            if (window.confirm(calc.clearConfirm)) setStoredValue(KEY, null);
          }}
        >
          {calc.clear}
        </button>
      ) : null}
    </section>
  );
}
