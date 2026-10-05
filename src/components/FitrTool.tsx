"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { amountParam, formatMoney } from "@/lib/money";
import { MAX_FITR_PEOPLE, zakatAlFitr } from "@/lib/fitr";
import {
  CurrencySelect,
  KeepRecordNudge,
  useVisitorCurrency,
} from "@/components/public/VisitorCurrency";

/** With `currency`, the signed-in tool; without, a visitor picks one. */
export default function FitrTool({ currency: fixed }: { currency?: string }) {
  const [visitorCurrency, setVisitorCurrency] = useVisitorCurrency();
  const guest = fixed === undefined;
  const currency = fixed ?? visitorCurrency;
  const [people, setPeople] = useState("1");
  const [perPerson, setPerPerson] = useState("");

  const result = useMemo(
    () => zakatAlFitr(parseInt(people, 10) || 0, parseFloat(perPerson) || 0),
    [people, perPerson],
  );

  return (
    <div className="space-y-8">
      <section className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {guest ? (
            <div className="sm:col-span-2 sm:max-w-xs">
              <CurrencySelect value={currency} onChange={setVisitorCurrency} />
            </div>
          ) : null}
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

        {result.valid && guest ? <KeepRecordNudge what="it" /> : null}
        {result.valid && !guest && (
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
