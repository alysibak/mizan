"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  screenEquity,
  THRESHOLDS,
  type BusinessActivity,
  type DenominatorBasis,
  type ScreeningResult,
} from "@/lib/screening";
import { purificationAmount } from "@/lib/zakat";
import { amountParam, formatMoney, formatPercent } from "@/lib/money";

const ACTIVITIES: { key: keyof BusinessActivity; label: string }[] = [
  { key: "alcohol", label: "Alcohol" },
  { key: "gambling", label: "Gambling" },
  { key: "conventionalFinance", label: "Conventional finance / interest" },
  { key: "porkAndNonHalalFood", label: "Pork / non-halal food" },
  { key: "adultEntertainment", label: "Adult entertainment" },
  { key: "tobacco", label: "Tobacco" },
  { key: "weapons", label: "Weapons" },
];

const FIGURE_FIELDS: [string, string][] = [
  ["marketCap", "Market capitalisation"],
  ["totalAssets", "Total assets"],
  ["interestBearingDebt", "Interest-bearing debt"],
  ["cashAndInterestSecurities", "Cash + interest securities"],
  ["totalRevenue", "Total revenue"],
  ["impermissibleRevenue", "Impermissible revenue"],
];

const EMPTY_ACTIVITY: BusinessActivity = {
  alcohol: false,
  gambling: false,
  conventionalFinance: false,
  porkAndNonHalalFood: false,
  adultEntertainment: false,
  tobacco: false,
  weapons: false,
};

const STORAGE_KEY = "mizan-screening-draft";

type Draft = {
  name: string;
  activity: BusinessActivity;
  denominator: DenominatorBasis;
  figures: Record<string, string>;
};

export default function ScreeningTool({ currency = "CAD" }: { currency?: string }) {
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [activity, setActivity] = useState<BusinessActivity>(EMPTY_ACTIVITY);
  const [denominator, setDenominator] = useState<DenominatorBasis>("marketCap");
  const [figures, setFigures] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [dividend, setDividend] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Draft;
        if (d.name) setName(d.name);
        if (d.activity) setActivity({ ...EMPTY_ACTIVITY, ...d.activity });
        if (d.denominator === "marketCap" || d.denominator === "totalAssets") {
          setDenominator(d.denominator);
        }
        if (d.figures) setFigures(d.figures);
      }
    } catch {
      /* ignore a broken draft */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const draft: Draft = { name, activity, denominator, figures };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage full or blocked: the draft just is not kept */
    }
  }, [hydrated, name, activity, denominator, figures]);

  function run(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const num = (k: string) => parseFloat(figures[k] || "0") || 0;
    setResult(
      screenEquity(
        activity,
        {
          marketCap: num("marketCap"),
          totalAssets: num("totalAssets"),
          interestBearingDebt: num("interestBearingDebt"),
          cashAndInterestSecurities: num("cashAndInterestSecurities"),
          totalRevenue: num("totalRevenue"),
          impermissibleRevenue: num("impermissibleRevenue"),
        },
        { denominator },
      ),
    );
  }

  function clearDraft() {
    setName("");
    setActivity(EMPTY_ACTIVITY);
    setDenominator("marketCap");
    setFigures({});
    setResult(null);
    setDividend("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  const purifyDue = result
    ? purificationAmount(parseFloat(dividend) || 0, result.purificationRatio)
    : 0;

  return (
    <div className="space-y-8">
      <form onSubmit={run} className="space-y-8">
        <section className="card p-5">
          <h2 className="font-serif text-lg text-ink">Company</h2>
          <p className="mt-1 text-sm text-sage">
            Optional. Kept on this device so you can come back to the same
            figures without a paid data feed.
          </p>
          <div className="mt-4">
            <label className="label mb-1.5" htmlFor="company">
              Name or ticker
            </label>
            <input
              id="company"
              className="field max-w-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SU"
            />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-serif text-lg text-ink">Business activity</h2>
          <p className="mt-1 text-sm text-sage">
            Tick any impermissible activity that forms part of the company&apos;s core
            business. Any single one fails the business screen.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ACTIVITIES.map((a) => (
              <label
                key={a.key}
                className="flex items-center gap-2 rounded-lg border border-mist bg-white px-3 py-2 text-sm text-ink"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-danger"
                  checked={activity[a.key]}
                  onChange={(e) =>
                    setActivity({ ...activity, [a.key]: e.target.checked })
                  }
                />
                {a.label}
              </label>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-serif text-lg text-ink">Financial figures</h2>
          <p className="mt-1 text-sm text-sage">
            Enter values from the company&apos;s filings in any one consistent unit.
            Ratios are compared against the AAOIFI thresholds of{" "}
            {formatPercent(THRESHOLDS.debtRatio, 0)} and{" "}
            {formatPercent(THRESHOLDS.impermissibleRevenueRatio, 0)}.
          </p>

          <div className="mt-4">
            <label className="label mb-1.5" htmlFor="denominator">
              Ratio denominator
            </label>
            <select
              id="denominator"
              className="field max-w-xs"
              value={denominator}
              onChange={(e) => setDenominator(e.target.value as DenominatorBasis)}
            >
              <option value="marketCap">Market capitalisation</option>
              <option value="totalAssets">Total assets</option>
            </select>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FIGURE_FIELDS.map(([fieldName, label]) => (
              <div key={fieldName}>
                <label className="label mb-1.5" htmlFor={fieldName}>
                  {label}
                </label>
                <input
                  id={fieldName}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className="field nums"
                  placeholder="0"
                  value={figures[fieldName] ?? ""}
                  onChange={(e) =>
                    setFigures({ ...figures, [fieldName]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary">
            Screen this stock
          </button>
          <button type="button" className="btn-ghost" onClick={clearDraft}>
            Clear
          </button>
        </div>
      </form>

      {result && (
        <section
          className={
            "card border-2 p-5 " +
            (result.compliant ? "border-gain/40" : "border-danger/40")
          }
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-ink">
              {name ? `${name}: ` : ""}
              {result.compliant ? "Meets these checks" : "Does not meet these checks"}
            </h2>
            <span
              className={
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium " +
                (result.compliant
                  ? "bg-gain/10 text-gain"
                  : "bg-danger/10 text-danger")
              }
            >
              {result.compliant ? "Checks cleared" : "Checks failed"}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2">
              <span className={result.businessPass ? "text-gain" : "text-danger"}>
                {result.businessPass ? "✓" : "✕"}
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Business activity</p>
                <p className="text-xs text-sage">
                  {result.businessPass
                    ? "Core business is acceptable."
                    : `Fails on: ${result.failingActivities.join(", ")}.`}
                </p>
              </div>
            </div>

            {result.ratios.map((r) => (
              <div key={r.label} className="flex items-start gap-2">
                <span className={r.pass ? "text-gain" : "text-danger"}>
                  {r.pass ? "✓" : "✕"}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium text-ink">{r.label}</p>
                    <p className="text-sm nums text-ink">
                      {Number.isFinite(r.value) ? formatPercent(r.value) : "n/a"}
                    </p>
                  </div>
                  <p className="text-xs text-sage">
                    Threshold: under {formatPercent(r.threshold, 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {result.compliant && result.purificationRatio > 0 && (
            <div className="mt-4 space-y-3 rounded-lg bg-porcelain px-3 py-3">
              <p className="text-xs leading-relaxed text-sage">
                If you hold this stock, purify{" "}
                <span className="text-brass">
                  {formatPercent(result.purificationRatio)}
                </span>{" "}
                of any dividend income by giving it away. That gift is not zakat.
              </p>
              <div className="max-w-xs">
                <label className="label mb-1.5" htmlFor="dividend">
                  Dividend received
                </label>
                <input
                  id="dividend"
                  type="number"
                  step="0.01"
                  min="0"
                  className="field nums"
                  placeholder="0.00"
                  value={dividend}
                  onChange={(e) => setDividend(e.target.value)}
                />
              </div>
              {purifyDue > 0 && (
                <p className="text-sm text-ink">
                  Give away{" "}
                  <span className="nums font-medium text-brass">
                    {formatMoney(purifyDue, currency)}
                  </span>
                </p>
              )}
              <Link
                href={
                  purifyDue > 0
                    ? `/giving?type=purification&amount=${amountParam(purifyDue)}`
                    : "/giving?type=purification"
                }
                className="btn-primary"
              >
                Record purification
              </Link>
            </div>
          )}

          <p className="mt-4 text-xs leading-relaxed text-sage">
            These are commonly cited AAOIFI-style thresholds. Index providers
            (Dow Jones Islamic, S&amp;P Shariah, MSCI Islamic) differ. Clearing
            these checks is a starting point for your own research — not a
            fatwa and not investment advice.{" "}
            <Link href="/trust" className="text-pine hover:underline">
              What is verified
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
