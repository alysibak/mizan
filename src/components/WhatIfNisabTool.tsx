"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/money";
import { whatIfNisab } from "@/lib/unique-calcs";
import type { CalendarBasis } from "@/lib/zakat";
import ReckoningStepNav from "@/components/ReckoningStepNav";

export default function WhatIfNisabTool({
  currency,
  netZakatable,
  goldPricePerGram,
  silverPricePerGram,
  standard,
  basis,
}: {
  currency: string;
  netZakatable: number;
  goldPricePerGram: number;
  silverPricePerGram: number;
  standard: "gold" | "silver";
  basis: CalendarBasis;
}) {
  const [gold, setGold] = useState(goldPricePerGram);
  const [silver, setSilver] = useState(silverPricePerGram);
  const [std, setStd] = useState(standard);

  const result = useMemo(
    () =>
      whatIfNisab({
        netZakatable,
        goldPricePerGram: gold,
        silverPricePerGram: silver,
        standard: std,
        basis,
      }),
    [netZakatable, gold, silver, std, basis],
  );

  return (
    <div className="space-y-8">
      <ReckoningStepNav current="what-if" />

      <header>
        <p className="label text-brass">Sensitivity</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">What if prices move?</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          Hold your current net zakatable wealth still. Nothing saves until you
          change settings yourself.
        </p>
      </header>

      <p className="text-sm text-sage">
        Your net now:{" "}
        <span className="nums text-ink">
          {formatMoney(netZakatable, currency)}
        </span>
      </p>

      <div className="space-y-6">
        <div>
          <label className="label mb-1.5" htmlFor="gold">
            Gold / gram ({currency}): {gold.toFixed(2)}
          </label>
          <input
            id="gold"
            type="range"
            min={Math.max(10, goldPricePerGram * 0.5)}
            max={goldPricePerGram * 1.8 || 200}
            step="0.5"
            value={gold}
            onChange={(e) => setGold(parseFloat(e.target.value))}
            className="w-full accent-pine"
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="silver">
            Silver / gram ({currency}): {silver.toFixed(4)}
          </label>
          <input
            id="silver"
            type="range"
            min={Math.max(0.2, silverPricePerGram * 0.4)}
            max={silverPricePerGram * 2.5 || 5}
            step="0.01"
            value={silver}
            onChange={(e) => setSilver(parseFloat(e.target.value))}
            className="w-full accent-pine"
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="std">
            Standard
          </label>
          <select
            id="std"
            className="field max-w-xs"
            value={std}
            onChange={(e) => setStd(e.target.value as "gold" | "silver")}
          >
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
          </select>
        </div>
      </div>

      <section
        className={
          "border px-5 py-6 " +
          (result.meetsNisab
            ? "border-pine/40 bg-pine/5"
            : "border-mist bg-paper")
        }
      >
        <p className="label text-brass">
          {result.meetsNisab
            ? "Above nisab at these prices"
            : "Below nisab at these prices"}
        </p>
        <p className="mt-2 font-serif text-3xl text-ink nums">
          {formatMoney(result.chosenNisab, currency)}
        </p>
        <p className="mt-1 text-sm text-sage">
          Margin{" "}
          <span className="nums text-ink">
            {result.margin >= 0 ? "+" : ""}
            {formatMoney(result.margin, currency)}
          </span>
          {result.meetsNisab
            ? ` · would-be zakat ${formatMoney(result.zakatIfDue, currency)} (nisab only)`
            : ""}
        </p>
        <div className="mt-4 h-2 overflow-hidden bg-mist">
          <div
            className="h-full bg-pine transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(4, (result.netZakatable / Math.max(result.chosenNisab, 1)) * 100))}%`,
            }}
          />
        </div>
      </section>

      <ReckoningStepNav current="what-if" />
    </div>
  );
}
