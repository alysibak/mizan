"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { amountParam, formatMoney } from "@/lib/money";
import { MAX_FITR_PEOPLE, zakatAlFitr } from "@/lib/fitr";

export default function FitrTool({ currency }: { currency: string }) {
  const [people, setPeople] = useState("1");
  const [perPerson, setPerPerson] = useState("");

  const result = useMemo(
    () => zakatAlFitr(parseInt(people, 10) || 0, parseFloat(perPerson) || 0),
    [people, perPerson],
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brass">End of Ramadan</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Zakat al-Fitr</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          A set amount for yourself and each person you provide for — children
          included — given before the Eid prayer. It is separate from zakat on
          wealth and does not reduce what you owe for the hawl.
        </p>
      </header>

      <section className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5" htmlFor="people">
              People you provide for
            </label>
            <input
              id="people"
              type="number"
              inputMode="numeric"
              min="1"
              max={MAX_FITR_PEOPLE}
              step="1"
              className="field nums"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-sage">Including yourself.</p>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="perPerson">
              Amount per person ({currency})
            </label>
            <input
              id="perPerson"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              className="field nums"
              placeholder="0.00"
              value={perPerson}
              onChange={(e) => setPerPerson(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-sage">
              The figure your mosque or council announces this year — the price
              of one sa’ of staple food where you live.
            </p>
          </div>
        </div>

        <div
          className={
            "border px-4 py-4 " +
            (result.valid ? "border-pine/30 bg-pine/5" : "border-mist")
          }
        >
          <p className="text-sm text-sage">{result.message}</p>
          {result.valid && (
            <p className="mt-2 font-serif text-3xl text-pine nums">
              {formatMoney(result.total, currency)}
            </p>
          )}
        </div>

        {result.valid && (
          <Link
            href={`/giving?type=fitr&amount=${amountParam(result.total)}`}
            className="btn-primary"
          >
            Record on Give
          </Link>
        )}
      </section>

      <p className="text-xs leading-relaxed text-sage">
        Schools differ on giving food or its value in money, and on the size of
        the measure. Follow the guidance of those you trust; this only does the
        multiplication.
      </p>
    </div>
  );
}
