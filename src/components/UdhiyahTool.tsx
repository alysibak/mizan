"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { amountParam, formatMoney } from "@/lib/money";
import { calculateUdhiyah, type UdhiyahAnimal } from "@/lib/udhiyah";
import {
  CurrencySelect,
  KeepRecordNudge,
  useVisitorCurrency,
} from "@/components/public/VisitorCurrency";

/** With `currency`, the signed-in tool; without, a visitor picks one. */
export default function UdhiyahTool({
  currency: fixed,
}: {
  currency?: string;
}) {
  const [visitorCurrency, setVisitorCurrency] = useVisitorCurrency();
  const guest = fixed === undefined;
  const currency = fixed ?? visitorCurrency;
  const [animal, setAnimal] = useState<UdhiyahAnimal>("sheep");
  const [cost, setCost] = useState("");
  const [shares, setShares] = useState("1");
  const [extras, setExtras] = useState("");

  const result = useMemo(
    () =>
      calculateUdhiyah({
        animal,
        animalCost: parseFloat(cost) || 0,
        yourShares: parseInt(shares, 10) || 0,
        extras: parseFloat(extras) || 0,
      }),
    [animal, cost, shares, extras],
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
            <label className="label mb-1.5" htmlFor="animal">
              Animal
            </label>
            <select
              id="animal"
              className="field"
              value={animal}
              onChange={(e) => {
                const next = e.target.value as UdhiyahAnimal;
                setAnimal(next);
                setShares("1");
              }}
            >
              <option value="sheep">Sheep (1 share)</option>
              <option value="goat">Goat (1 share)</option>
              <option value="cow">Cow / ox (up to 7)</option>
              <option value="camel">Camel (up to 7)</option>
            </select>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="cost">
              Total animal cost ({currency})
            </label>
            <input
              id="cost"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="field nums"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="shares">
              Your shares
            </label>
            <input
              id="shares"
              type="number"
              inputMode="numeric"
              min="1"
              max={animal === "cow" || animal === "camel" ? 7 : 1}
              step="1"
              className="field nums"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
            />
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="extras">
              Extras / fees ({currency})
            </label>
            <input
              id="extras"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="field nums"
              value={extras}
              onChange={(e) => setExtras(e.target.value)}
              placeholder="0.00"
            />
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
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-sage">Per share</dt>
                <dd className="nums">
                  {formatMoney(result.shareCost, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-sage">Your shares</dt>
                <dd className="nums">
                  {formatMoney(result.yourCost, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-mist pt-2">
                <dt className="text-ink">Total with extras</dt>
                <dd className="font-serif text-xl nums text-pine">
                  {formatMoney(result.totalWithExtras, currency)}
                </dd>
              </div>
            </dl>
          )}
        </div>

        {result.valid && guest ? <KeepRecordNudge what="it" /> : null}
        {result.valid && !guest && (
          <Link
            href={`/giving?type=sadaqah&amount=${amountParam(result.totalWithExtras)}`}
            className="btn-primary"
          >
            Record as sadaqah on Give
          </Link>
        )}
      </section>

      <p className="text-xs text-sage">
        Udhiyah is not zakat. If you also pay zakat this season, keep them as
        separate records. Ask a local scholar for obligation and distribution.
      </p>
    </div>
  );
}
