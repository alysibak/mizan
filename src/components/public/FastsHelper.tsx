"use client";

import { useState } from "react";
import Link from "next/link";
import { CurrencySelect, useVisitorCurrency } from "@/components/public/VisitorCurrency";
import { MoneyInput } from "@/components/ZakatCalculator";
import { parseAmount } from "@/lib/calculator";
import { useStoredState, useStoredValue } from "@/lib/client-store";
import {
  FASTS_KEY,
  KAFFARAH_FAST_DAYS,
  KAFFARAH_PEOPLE,
  OATH_FAST_DAYS,
  OATH_PEOPLE,
  count,
  fastsOwed,
  parseFasts,
} from "@/lib/fasts";
import { FITR_KEY, parseFitr } from "@/lib/fitr";
import { ramadanStatus } from "@/lib/hijri";
import { weeklyCalendar } from "@/lib/ics";
import { formatMoney } from "@/lib/money";

const INTL = "en-CA";

/** Why a fast was missed, and what follows from it. */
const REASONS = [
  {
    key: "ill",
    label: "I was ill or travelling",
    answer: "Make up each day you missed, one for one, before next Ramadan if you can. No money is due.",
  },
  {
    key: "period",
    label: "My period, or after childbirth",
    answer: "Make up each day you missed. The prayers missed in those days are not made up.",
  },
  {
    key: "baby",
    label: "I was pregnant or breastfeeding",
    answer:
      "Make up each day when you are able. Scholars differ on more: some add fidya for each day if you feared only for the baby. Ask a scholar you trust.",
  },
  {
    key: "old",
    label: "I am too old or ill to ever fast",
    answer:
      "You do not make them up. Instead, feed one poor person for each day: this is fidya. Put the days under “Fidya” below.",
  },
  {
    key: "broke",
    label: "I broke a fast on purpose",
    answer:
      "Make that day up, turn to Allah in repentance, and pay kaffarah: fast 60 days in a row. Only if you truly cannot, feed 60 poor people. Scholars differ on whether eating on purpose needs kaffarah or only intercourse does.",
  },
  {
    key: "oath",
    label: "I swore an oath and broke it",
    answer: "Feed or clothe ten poor people. Only if you cannot, fast three days. Put it under “Broken oaths” below.",
  },
] as const;

function download(name: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DaysInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label mb-1.5" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        className="field text-lg nums"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Done({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-base">
      <input type="checkbox" className="h-5 w-5 accent-pine" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/**
 * Fasts owed from past Ramadans: why they were missed and what follows, a
 * count of days made up, and fidya and kaffarah worked out from what feeding
 * one person costs. Kept on this phone; My zakat reminds until it is done.
 */
export default function FastsHelper() {
  const [currency, setCurrency] = useVisitorCurrency();
  const [kept, save] = useStoredState(FASTS_KEY, parseFasts);
  const fitr = parseFitr(useStoredValue(FITR_KEY));
  const [reason, setReason] = useState<string | null>(null);
  const money = (n: number) => formatMoney(n, currency, INTL);
  const perDay = parseAmount(kept.perDay, ".");
  const owed = fastsOwed(kept, perDay);
  const total = count(kept.owed);
  const set = (patch: Partial<typeof kept>) => save({ ...kept, ...patch });
  const chosen = REASONS.find((r) => r.key === reason);
  // Ask only for what the reason calls for, plus anything already kept: someone
  // who was ill for a week sees one box, not five.
  const showMakeUp = (reason !== "old" && reason !== "oath") || count(kept.owed) > 0;
  const showFidya = reason === "old" || count(kept.fidyaDays) > 0;
  const showKaffarah = reason === "broke" || count(kept.kaffarah) > 0;
  const showOaths = reason === "oath" || count(kept.oaths) > 0;
  const showFood = showFidya || showKaffarah || showOaths;

  function remind() {
    const today = new Date();
    const utc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const ramadan = ramadanStatus(utc);
    const until = new Date(utc.getTime() + Math.max(7, ramadan.inRamadan ? 365 : ramadan.daysUntil) * 86_400_000);
    download(
      "make-up-fasts.ics",
      weeklyCalendar({
        start: utc.toISOString().slice(0, 10),
        until: until.toISOString().slice(0, 10),
        days: ["MO", "TH"],
        summary: "Make up a fast",
        description:
          "A day to make up one of the fasts you missed, from Mizan. Eat suhoor before dawn and make the intention. When you have fasted it, tap “I made up a fast” in Mizan.",
        uid: "mizan-make-up-fasts",
      }),
    );
  }

  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6" aria-labelledby="why-title">
        <h2 id="why-title" className="font-serif text-2xl text-ink">
          Why did you miss them?
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {REASONS.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-pressed={reason === r.key}
              onClick={() => setReason(reason === r.key ? null : r.key)}
              className={
                "min-h-[52px] border px-4 py-3 text-start text-base font-medium transition " +
                (reason === r.key ? "border-pine bg-pine text-surface" : "border-mist bg-surface text-ink hover:border-pine")
              }
            >
              {r.label}
            </button>
          ))}
        </div>
        {chosen ? (
          <p className="mt-4 border-s-4 border-pine bg-pine/5 p-4 text-base leading-relaxed text-ink" role="status">
            {chosen.answer}
          </p>
        ) : null}
      </section>

      {showMakeUp ? (
        <section className="card space-y-4 p-5 sm:p-6" aria-labelledby="make-up-title">
          <h2 id="make-up-title" className="font-serif text-2xl text-ink">
            Fasts to make up
          </h2>
          <div className="sm:max-w-xs">
            <DaysInput id="fasts-owed" label="How many days did you miss?" value={kept.owed} onChange={(v) => set({ owed: v })} />
            <p className="mt-1 text-xs text-sage">Not sure? Count your best guess. Allah knows your effort.</p>
          </div>
          {total > 0 ? (
            <div className="space-y-3 border-t border-mist pt-4">
              <div className="h-3 overflow-hidden bg-mist" aria-hidden>
                <div className="h-full bg-pine transition-all" style={{ width: `${Math.min(100, Math.round((kept.madeUp / total) * 100))}%` }} />
              </div>
              <p className="text-lg font-medium text-ink nums" aria-live="polite">
                {owed.left > 0
                  ? `${owed.left} ${owed.left === 1 ? "fast" : "fasts"} left · ${Math.min(kept.madeUp, total)} made up`
                  : "All made up. May Allah accept them."}
              </p>
              <div className="flex flex-wrap gap-3">
                {owed.left > 0 ? (
                  <button type="button" className="btn-primary px-5 py-3 text-base" onClick={() => set({ madeUp: kept.madeUp + 1 })}>
                    I made up a fast
                  </button>
                ) : null}
                {kept.madeUp > 0 ? (
                  <button type="button" className="btn-ghost px-4 py-3 text-base" onClick={() => set({ madeUp: kept.madeUp - 1 })}>
                    Undo one
                  </button>
                ) : null}
                {owed.left > 0 ? (
                  <button type="button" className="btn-ghost px-5 py-3 text-base" onClick={remind}>
                    Remind me on Mondays and Thursdays
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {showFood ? (
        <section className="card space-y-4 p-5 sm:p-6" aria-labelledby="food-title">
          <h2 id="food-title" className="font-serif text-2xl text-ink">
            Giving instead
          </h2>
          <p className="text-base text-sage">
            Counted in meals: feeding one poor person for a day. Many mosques announce what that costs each Ramadan.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <CurrencySelect value={currency} onChange={setCurrency} label="Currency" />
            <MoneyInput
              id="fasts-per-day"
              label="Feeding one person for a day costs"
              currency={currency}
              value={kept.perDay}
              onChange={(v) => set({ perDay: v })}
              intl={INTL}
              decimal="."
            />
          </div>
          {!kept.perDay && fitr.perPerson ? (
            <button type="button" className="text-sm font-medium text-pine hover:underline" onClick={() => set({ perDay: fitr.perPerson })}>
              Use my Zakat al-Fitr amount ({money(parseAmount(fitr.perPerson, "."))})
            </button>
          ) : null}

          {showFidya ? (
          <div className="space-y-3 border-t border-mist pt-4">
            <h3 className="font-serif text-xl text-ink">Fidya</h3>
            <div className="sm:max-w-xs">
              <DaysInput
                id="fasts-fidya-days"
                label="Days you will never be able to fast"
                value={kept.fidyaDays}
                onChange={(v) => set({ fidyaDays: v, fidyaGiven: false })}
              />
            </div>
            {owed.fidya > 0 ? (
              <>
                <p className="text-lg font-medium text-ink nums">
                  Fidya: {money(owed.fidya)} ({count(kept.fidyaDays)} {count(kept.fidyaDays) === 1 ? "meal" : "meals"})
                </p>
                <Done checked={kept.fidyaGiven} onChange={(v) => set({ fidyaGiven: v })} label="I have given it" />
              </>
            ) : null}
          </div>

          ) : null}

          {showKaffarah ? (
          <div className="space-y-3 border-t border-mist pt-4">
            <h3 className="font-serif text-xl text-ink">Kaffarah for a fast broken on purpose</h3>
            <div className="sm:max-w-xs">
              <DaysInput
                id="fasts-kaffarah"
                label="Ramadan fasts broken on purpose"
                value={kept.kaffarah}
                onChange={(v) => set({ kaffarah: v, kaffarahDone: false })}
              />
            </div>
            {owed.kaffarahDays > 0 ? (
              <>
                <p className="text-base text-ink nums">
                  Fast <strong>{owed.kaffarahDays} days in a row</strong> ({KAFFARAH_FAST_DAYS} for each). Only if you
                  truly cannot: feed {count(kept.kaffarah) * KAFFARAH_PEOPLE} people
                  {owed.kaffarahFood > 0 ? `, ${money(owed.kaffarahFood)}` : ""}.
                </p>
                <Done checked={kept.kaffarahDone} onChange={(v) => set({ kaffarahDone: v })} label="Done" />
              </>
            ) : null}
          </div>

          ) : null}

          {showOaths ? (
          <div className="space-y-3 border-t border-mist pt-4">
            <h3 className="font-serif text-xl text-ink">Broken oaths</h3>
            <div className="sm:max-w-xs">
              <DaysInput id="fasts-oaths" label="Oaths you broke" value={kept.oaths} onChange={(v) => set({ oaths: v, oathsDone: false })} />
            </div>
            {owed.oathDays > 0 ? (
              <>
                <p className="text-base text-ink nums">
                  Feed or clothe <strong>{count(kept.oaths) * OATH_PEOPLE} poor people</strong> ({OATH_PEOPLE} for each)
                  {owed.oathFood > 0 ? `: ${money(owed.oathFood)}` : ""}. Only if you cannot: fast {owed.oathDays} days (
                  {OATH_FAST_DAYS} for each).
                </p>
                <Done checked={kept.oathsDone} onChange={(v) => set({ oathsDone: v })} label="Done" />
              </>
            ) : null}
          </div>
          ) : null}
          <p className="text-sm text-sage">
            Give it to people in need, or to a mosque or charity that will feed them.{" "}
            <Link href="/give" className="font-medium text-pine hover:underline">
              Where to give
            </Link>
          </p>
        </section>
      ) : (
        <p className="text-sm text-sage">
          Too old or ill to fast, broke a fast on purpose, or broke an oath? Tap that reason above and Mizan works out
          what to give.
        </p>
      )}
    </div>
  );
}
