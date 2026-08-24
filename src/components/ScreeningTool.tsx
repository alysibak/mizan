"use client";

import { useState } from "react";
import {
  screenEquity,
  THRESHOLDS,
  type BusinessActivity,
  type DenominatorBasis,
  type ScreeningResult,
} from "@/lib/screening";
import { formatPercent } from "@/lib/money";

const ACTIVITIES: { key: keyof BusinessActivity; label: string }[] = [
  { key: "alcohol", label: "Alcohol" },
  { key: "gambling", label: "Gambling" },
  { key: "conventionalFinance", label: "Conventional finance / interest" },
  { key: "porkAndNonHalalFood", label: "Pork / non-halal food" },
  { key: "adultEntertainment", label: "Adult entertainment" },
  { key: "tobacco", label: "Tobacco" },
  { key: "weapons", label: "Weapons" },
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

export default function ScreeningTool() {
  const [activity, setActivity] = useState<BusinessActivity>(EMPTY_ACTIVITY);
  const [denominator, setDenominator] = useState<DenominatorBasis>("marketCap");
  const [result, setResult] = useState<ScreeningResult | null>(null);

  function run(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => parseFloat(String(f.get(k) || "0")) || 0;
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

  return (
    <div className="space-y-8">
      <form onSubmit={run} className="space-y-8">
        <section className="card p-5">
          <h2 className="font-serif text-lg text-ink">Business activity</h2>
          <p className="mt-1 text-sm text-sage">
            Tick any impermissible activity that forms part of the company's core
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
            Enter values from the company's filings in any one consistent unit.
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
            {[
              ["marketCap", "Market capitalisation"],
              ["totalAssets", "Total assets"],
              ["interestBearingDebt", "Interest-bearing debt"],
              ["cashAndInterestSecurities", "Cash + interest securities"],
              ["totalRevenue", "Total revenue"],
              ["impermissibleRevenue", "Impermissible revenue"],
            ].map(([name, label]) => (
              <div key={name}>
                <label className="label mb-1.5" htmlFor={name}>
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type="number"
                  step="any"
                  min="0"
                  className="field nums"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </section>

        <button type="submit" className="btn-primary">
          Screen this stock
        </button>
      </form>

      {result && (
        <section
          className={
            "card border-2 p-5 " +
            (result.compliant ? "border-gain/40" : "border-danger/40")
          }
        >
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-ink">
              {result.compliant ? "Passes screening" : "Does not pass"}
            </h2>
            <span
              className={
                "rounded-full px-3 py-1 text-xs font-medium " +
                (result.compliant
                  ? "bg-gain/10 text-gain"
                  : "bg-danger/10 text-danger")
              }
            >
              {result.compliant ? "Compliant" : "Non-compliant"}
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
            <p className="mt-4 rounded-lg bg-porcelain px-3 py-2 text-xs leading-relaxed text-sage">
              If you hold this stock, purify{" "}
              <span className="text-brass">
                {formatPercent(result.purificationRatio)}
              </span>{" "}
              of any dividend income by giving it away, since that share of
              revenue is impermissible.
            </p>
          )}

          <p className="mt-4 text-xs leading-relaxed text-sage">
            This applies common AAOIFI thresholds. Index providers differ in their
            exact rules, and a passing screen is a starting point, not a
            recommendation. Verify with a qualified source before investing.
          </p>
        </section>
      )}
    </div>
  );
}
