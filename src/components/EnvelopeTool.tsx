"use client";

import { useState } from "react";
import Link from "next/link";
import { amountParam, formatMoney } from "@/lib/money";
import ReckoningStepNav from "@/components/ReckoningStepNav";

/** Closing the year, step 2: give it, then say so. */
export default function EnvelopeTool({
  currency,
  defaultTotal = 0,
}: {
  currency: string;
  defaultTotal?: number;
}) {
  const [total, setTotal] = useState(defaultTotal > 0 ? String(defaultTotal) : "");
  const totalNum = parseFloat(total) || 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Close the year · step 2 of 3</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Give your zakat</h1>
        <p className="mt-2 max-w-xl text-base text-sage">
          Give it to people in need, then note it here. Not sure who may receive
          it?{" "}
          <Link href="/who-can-receive" className="text-pine underline underline-offset-2">
            See who can
          </Link>
          .
        </p>
      </header>

      <div className="max-w-xs">
        <label className="label mb-1.5" htmlFor="total">
          Zakat to give ({currency})
        </label>
        <input
          id="total"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          className="field nums"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
      </div>

      {totalNum > 0 ? (
        <Link href={`/giving?type=zakat&amount=${amountParam(totalNum)}`} className="btn-primary">
          I gave {formatMoney(totalNum, currency)}
        </Link>
      ) : null}

      <ReckoningStepNav current="envelopes" />
    </div>
  );
}
