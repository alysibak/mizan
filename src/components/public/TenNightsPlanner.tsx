"use client";

import { useState } from "react";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { Choice, MoneyInput } from "@/components/ZakatCalculator";
import { useHydrated } from "@/lib/client-store";
import { decimalMarkFor, parseAmount } from "@/lib/calculator";
import { ramadanStatus } from "@/lib/hijri";
import { eveningsCalendar } from "@/lib/ics";
import { formatMoney } from "@/lib/money";
import { tenNightsPlan } from "@/lib/ten-nights";
import { track } from "@/lib/analytics";

const INTL = "en-CA";

/**
 * Spread a gift over the last ten nights of Ramadan, more on the odd nights
 * if wished, with a calendar reminder for each evening. Worked out in the
 * browser from today's date, so a plan made during Ramadan covers only the
 * nights still to come. Nothing is paid or stored.
 */
export default function TenNightsPlanner() {
  const hydrated = useHydrated();
  const [currency, setCurrency] = useVisitorCurrency();
  const [amount, setAmount] = useState("");
  const [oddWeight, setOddWeight] = useState(2);
  const total = parseAmount(amount, decimalMarkFor(INTL));
  const money = (n: number) => formatMoney(n, currency, INTL);

  // Dates depend on today, so they are only drawn in the browser.
  const status = hydrated ? ramadanStatus(new Date()) : null;
  const from = status?.inRamadan && status.day ? status.day + 1 : 21;
  const plan = status ? tenNightsPlan(total, status.start, status.eid, oddWeight, from) : [];
  const evening = (day: string) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString(INTL, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

  function remind() {
    const ics = eveningsCalendar({
      uid: `nights-${status?.hijriYear ?? "ramadan"}`,
      time: "19:30",
      events: plan.map((n) => ({
        day: n.evening,
        summary: `Night ${n.night} of Ramadan: give ${money(n.amount)}`,
        description:
          "Your last-ten-nights plan from Mizan. Laylat al-Qadr is sought in the odd nights. The date follows the Umm al-Qura calendar; check your local moon sighting.",
      })),
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "last-ten-nights.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track("Reminder", { via: "ten-nights" });
  }

  return (
    <section className="card space-y-5 p-5 sm:p-6" aria-labelledby="nights-title">
      <div>
        <h2 id="nights-title" className="font-serif text-2xl text-ink">
          Your last-ten-nights plan
        </h2>
        <p className="mt-1 text-sm text-sage">
          Choose an amount. Mizan spreads it over the nights and gives you a reminder for each evening. You give
          through your mosque or a charity you trust; nothing is paid here.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CurrencySelect value={currency} onChange={setCurrency} label="Currency" />
        <MoneyInput
          id="nights-amount"
          label="Amount to give in total"
          currency={currency}
          value={amount}
          onChange={setAmount}
          intl={INTL}
        />
      </div>
      <fieldset>
        <legend className="label mb-2">How to spread it</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice
            name="nights-weight"
            checked={oddWeight === 2}
            onChange={() => setOddWeight(2)}
            title="Twice as much on the odd nights"
            detail="When Laylat al-Qadr is most hoped for: the 21st, 23rd, 25th, 27th, and 29th."
          />
          <Choice
            name="nights-weight"
            checked={oddWeight === 1}
            onChange={() => setOddWeight(1)}
            title="The same every night"
          />
        </div>
      </fieldset>

      {plan.length > 0 ? (
        <>
          <ol className="divide-y divide-mist border-y border-mist" aria-label="Your plan, night by night">
            {plan.map((n) => (
              <li key={n.night} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-3">
                  <span
                    className={
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium nums " +
                      (n.odd ? "bg-brass text-surface" : "border border-mist text-sage")
                    }
                    aria-hidden
                  >
                    {n.night}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">
                      Night {n.night}
                      {n.odd ? <span className="sr-only"> (an odd night)</span> : null}
                    </span>
                    <span className="block text-xs text-sage">Evening of {evening(n.evening)}</span>
                  </span>
                </span>
                <span className="font-serif text-lg text-pine nums">{money(n.amount)}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary px-5 py-3 text-base" onClick={remind}>
              Add a reminder for each night
            </button>
            <p className="text-xs text-sage">
              Dates follow the Umm al-Qura calendar and may move a day with your local moon sighting.
            </p>
          </div>
        </>
      ) : hydrated && total > 0 ? (
        <p className="text-sm text-sage">The last ten nights of this Ramadan have passed. May Allah accept your giving.</p>
      ) : null}
    </section>
  );
}
