"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ASNAF } from "@/lib/asnaf";
import { allocateEnvelopes } from "@/lib/unique-calcs";
import { amountParam, formatMoney } from "@/lib/money";
import ReckoningStepNav from "@/components/ReckoningStepNav";

export default function EnvelopeTool({
  currency,
  defaultTotal = 0,
}: {
  currency: string;
  defaultTotal?: number;
}) {
  const [total, setTotal] = useState(
    defaultTotal > 0 ? String(defaultTotal) : "",
  );
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const a of ASNAF) {
      init[a.key] = a.key === "faqir" || a.key === "miskin" ? 1 : 0;
    }
    return init;
  });

  const parts = useMemo(
    () => allocateEnvelopes(parseFloat(total) || 0, weights),
    [total, weights],
  );
  const sumWeights = Object.values(weights).reduce((s, w) => s + w, 0);
  const totalNum = parseFloat(total) || 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brassDeep">Close the year · step 2 of 3</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Give your zakat</h1>
        <p className="mt-2 max-w-xl text-base text-sage">
          You may give it all to the poor and needy, or share it between the
          eight groups the Quran names. Once you have given it, note it here.
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
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/giving?type=zakat&amount=${amountParam(totalNum)}`}
            className="btn-primary"
          >
            I gave all {formatMoney(totalNum, currency)}
          </Link>
        </div>
      ) : null}

      <details>
        <summary className="cursor-pointer text-sm text-pine hover:underline">
          Share it between the eight groups (optional)
        </summary>
        <div className="mt-4 space-y-4">
          <ul className="space-y-4">
            {ASNAF.map((a) => {
              const part = parts.find((p) => p.key === a.key);
              return (
                <li key={a.key} className="border border-mist px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-serif text-lg text-ink">{a.label}</p>
                    <label className="text-xs text-sage">
                      Shares{" "}
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        className="field ml-2 inline-block w-16 nums py-1"
                        value={weights[a.key] ?? 0}
                        onChange={(e) =>
                          setWeights((w) => ({
                            ...w,
                            [a.key]: Math.max(0, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-sage">{a.note}</p>
                  {part ? (
                    <div className="mt-2 flex flex-wrap items-baseline gap-3">
                      <p className="font-serif text-xl text-pine nums">
                        {formatMoney(part.amount, currency)}
                      </p>
                      <Link
                        href={`/giving?type=zakat&amount=${amountParam(part.amount)}&asnaf=${a.key}`}
                        className="text-sm text-pine hover:underline"
                      >
                        Note this part as given
                      </Link>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {sumWeights === 0 ? (
            <p className="text-sm text-danger">Give at least one group a share above zero.</p>
          ) : null}
        </div>
      </details>

      <ReckoningStepNav current="envelopes" />
    </div>
  );
}
