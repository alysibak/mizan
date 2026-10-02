"use client";

import { useMemo, useState } from "react";
import {
  HEIR_LABELS,
  HEIR_MAX,
  distributeEstate,
  type HeirKey,
  type Heirs,
} from "@/lib/mirath";
import { formatMoney } from "@/lib/money";

const GROUPS: { title: string; keys: HeirKey[] }[] = [
  { title: "Spouse", keys: ["husband", "wife"] },
  { title: "Parents", keys: ["father", "mother"] },
  {
    title: "Grandparents",
    keys: ["paternalGrandfather", "paternalGrandmother", "maternalGrandmother"],
  },
  { title: "Children", keys: ["son", "daughter"] },
  { title: "Son's children", keys: ["sonsSon", "sonsDaughter"] },
  {
    title: "Siblings",
    keys: [
      "fullBrother",
      "fullSister",
      "paternalBrother",
      "paternalSister",
      "maternalBrother",
      "maternalSister",
    ],
  },
];

const BASIS: Record<string, string> = {
  fard: "Fixed share",
  asaba: "Residuary",
  "fard+asaba": "Fixed share + residue",
  radd: "Returned surplus (radd)",
};

export default function MirathTool({ currency }: { currency: string }) {
  const [heirs, setHeirs] = useState<Heirs>({});
  const [estate, setEstate] = useState(100_000);

  const result = useMemo(() => distributeEstate(heirs), [heirs]);
  const hasAnyone = Object.values(heirs).some((n) => (n ?? 0) > 0);

  function setCount(key: HeirKey, value: number) {
    const n = Math.max(0, Math.min(HEIR_MAX[key], Math.floor(value || 0)));
    setHeirs((prev) => {
      const next = { ...prev };
      if (n === 0) delete next[key];
      else next[key] = n;
      if (key === "husband" && n > 0) delete next.wife;
      if (key === "wife" && n > 0) delete next.husband;
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Estate</h2>
        <p className="mt-1 text-sm text-sage">
          Optional. Fractions are exact either way; a figure just shows cash
          amounts beside each share.
        </p>
        <div className="mt-4 max-w-xs">
          <label className="label mb-1.5" htmlFor="estate">
            Net estate ({currency})
          </label>
          <input
            id="estate"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            className="field nums"
            value={estate}
            onChange={(e) => setEstate(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </section>

      {GROUPS.map((group) => (
        <section key={group.title} className="card p-5">
          <h2 className="font-serif text-lg text-ink">{group.title}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {group.keys.map((key) => (
              <label key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink">{HEIR_LABELS[key]}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={HEIR_MAX[key]}
                  className="field nums w-20"
                  value={heirs[key] ?? 0}
                  onChange={(e) => setCount(key, Number(e.target.value))}
                />
              </label>
            ))}
          </div>
        </section>
      ))}

      {!hasAnyone ? (
        <p className="text-sm text-sage">Name who survives, then the shares appear here.</p>
      ) : (
        <section className="card overflow-hidden p-0">
          <div className="border-b border-mist px-5 py-4">
            <h2 className="font-serif text-lg text-ink">Division</h2>
            <p className="mt-1 text-xs text-sage">
              {result.awlApplied && "Awl applied — shares reduced proportionally. "}
              {result.raddApplied &&
                "Radd applied — surplus returned to the sharers, not the spouse. "}
              Sunni framework. Estimation only.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="border-b border-mist bg-mist/30 text-xs uppercase tracking-wide text-sage">
                <tr>
                  <th className="px-5 py-3 font-medium">Heir</th>
                  <th className="px-5 py-3 font-medium">Basis</th>
                  <th className="px-5 py-3 font-medium">Share</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {result.shares.map((line) => (
                  <tr key={line.heir} className="border-b border-mist/70">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">
                        {HEIR_LABELS[line.heir]}
                        {line.count > 1 ? ` × ${line.count}` : ""}
                      </p>
                      <p className="text-xs text-sage">{line.reason}</p>
                    </td>
                    <td className="px-5 py-3 text-sage">{BASIS[line.basis]}</td>
                    <td className="px-5 py-3 nums text-ink">
                      {line.fraction.toString()}
                      {line.count > 1 && (
                        <span className="block text-xs text-sage">
                          {line.perHead.toString()} each
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 nums text-ink">
                      {formatMoney(line.fraction.value * estate, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!result.toTreasury.isZero() && (
            <p className="border-t border-mist px-5 py-3 text-sm text-sage">
              Remainder {result.toTreasury.toString()} (
              {formatMoney(result.toTreasury.value * estate, currency)}) classically
              passes to the public treasury.
            </p>
          )}
        </section>
      )}

      {result.notes.length > 0 && (
        <ul className="space-y-2 text-sm text-sage">
          {result.notes.map((n) => (
            <li key={n} className="rounded-lg border border-brass/30 bg-brass/5 px-4 py-3">
              {n}
            </li>
          ))}
        </ul>
      )}

      {result.blocked.length > 0 && (
        <section>
          <h2 className="font-serif text-lg text-ink">Excluded by closer heirs</h2>
          <ul className="mt-2 space-y-1 text-sm text-sage">
            {result.blocked.map((b) => (
              <li key={`${b.heir}-${b.by}`}>
                {HEIR_LABELS[b.heir]} — blocked by {b.by}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
