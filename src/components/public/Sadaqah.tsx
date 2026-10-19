"use client";

import { useState } from "react";
import {
  IconBalance,
  IconBeads,
  IconBook,
  IconBowl,
  IconDate,
  IconHeart,
  IconHourglass,
  IconOpenHand,
  IconPaw,
  IconRoad,
  IconSignpost,
  IconSmile,
  IconSpeech,
  IconSteps,
  IconSun,
  IconTree,
  IconUsers,
  IconWater,
} from "@/components/icons";
import { TierTag } from "@/components/public/Evidence";
import ShareButton, { type ShareLabels } from "@/components/public/ShareButton";
import { STRENGTH } from "@/content/evidence";
import { DEEDS, deedOfTheDay, type Deed } from "@/content/sadaqah";
import { setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import { DEED_DAYS_KEY as DAYS_KEY, dayKey, monthCount, monthGrid, parseDays, streak } from "@/lib/streak";

export const DEED_ICONS: Record<string, typeof IconSmile> = {
  smile: IconSmile,
  word: IconSpeech,
  road: IconRoad,
  help: IconOpenHand,
  peace: IconBalance,
  steps: IconSteps,
  dhikr: IconBeads,
  duha: IconSun,
  plant: IconTree,
  water: IconWater,
  guide: IconSignpost,
  family: IconUsers,
  food: IconBowl,
  harm: IconHeart,
  date: IconDate,
  respite: IconHourglass,
  teach: IconBook,
  animal: IconPaw,
};

/** Today's deed, the same for everyone today, with another a tap away. */
export function TodaysDeed({ share }: { share: ShareLabels }) {
  const hydrated = useHydrated();
  const [skip, setSkip] = useState(0);
  if (!hydrated) return <div className="card min-h-[16rem]" aria-hidden />;
  const today = deedOfTheDay(new Date());
  const deed = DEEDS[(DEEDS.indexOf(today) + skip) % DEEDS.length];
  const Icon = DEED_ICONS[deed.key];
  return (
    <section className="card border-brass/50 p-5 text-center sm:p-8" aria-labelledby="today-deed">
      <p className="label text-brassDeep">{skip === 0 ? "Today’s sadaqah" : "Or this one"}</p>
      <span className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full border border-brass/50 bg-brass/10 text-brassDeep" aria-hidden>
        {Icon ? <Icon className="h-12 w-12" /> : null}
      </span>
      <h2 id="today-deed" className="mt-4 font-serif text-3xl leading-tight text-ink" aria-live="polite">
        {deed.title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-sage">{deed.text}</p>
      <p className="mt-1 text-xs text-sage">{deed.ref}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn-ghost px-5 py-2.5" onClick={() => setSkip((s) => s + 1)}>
          Show me another
        </button>
        <ShareButton
          label="Share this"
          text={`${deed.title}: ${deed.text} (${deed.ref})`}
          path="/sadaqah"
          labels={share}
        />
      </div>
    </section>
  );
}

/** Every deed as a picture card that opens to its source. */
export function DeedCards({ deeds = DEEDS }: { deeds?: Deed[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {deeds.map((d) => {
        const Icon = DEED_ICONS[d.key];
        return (
          <li key={d.key} id={d.key}>
            <details className="group card h-full p-3">
              <summary className="flex cursor-pointer list-none flex-col items-center gap-2 text-center [&::-webkit-details-marker]:hidden">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine" aria-hidden>
                  {Icon ? <Icon className="h-8 w-8" /> : null}
                </span>
                <span className="text-sm font-medium leading-snug text-ink">{d.title}</span>
                <TierTag tier={STRENGTH[d.strength].tier} />
              </summary>
              <div className="mt-3 border-t border-mist pt-3 text-start">
                <p className="text-sm leading-relaxed text-ink">{d.text}</p>
                <p className="mt-1 text-xs leading-relaxed text-sage">{d.ref}</p>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

const KEEP_DAYS = 400;

/**
 * A month of good deeds: tap once a day, see the days fill in and the
 * streak grow. Kept in this browser only.
 */
export function DeedDays() {
  const hydrated = useHydrated();
  const days = parseDays(useStoredValue(DAYS_KEY));
  if (!hydrated) return <div className="card min-h-[20rem]" aria-hidden />;
  const today = new Date();
  const key = dayKey(today);
  const done = days.has(key);
  const run = streak(days, today);
  const month = today.toLocaleDateString("en-CA", { month: "long", year: "numeric" });

  function toggle() {
    const next = new Set(days);
    if (done) next.delete(key);
    else next.add(key);
    setStoredValue(DAYS_KEY, JSON.stringify([...next].sort().slice(-KEEP_DAYS)));
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="deed-days">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="deed-days" className="font-serif text-2xl text-ink">
            A little, every day
          </h2>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-sage">
            “The deeds most loved by Allah are those done regularly, even if they are small.”
            <span className="block text-xs">Sahih al-Bukhari and Sahih Muslim, from ‘A’ishah</span>
          </p>
        </div>
        <button
          type="button"
          aria-pressed={done}
          onClick={toggle}
          className={
            "min-h-[52px] px-5 text-base font-medium transition " +
            (done ? "border-2 border-pine bg-pine/5 text-pine" : "btn-primary")
          }
        >
          {done ? "✓ Done today" : "I did a good deed today"}
        </button>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center">
        <table className="w-full table-fixed text-center text-xs">
          <caption className="mb-2 text-start text-sm font-medium text-ink">{month}</caption>
          <thead>
            <tr className="text-sage">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                <th key={d} scope="col" className="pb-1 font-normal">
                  <span aria-hidden>{d[0]}</span>
                  <span className="sr-only">{d}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthGrid(today).map((week, w) => (
              <tr key={w}>
                {week.map((d, i) => {
                  if (!d) return <td key={i} />;
                  const k = dayKey(d);
                  const on = days.has(k);
                  const isToday = k === key;
                  return (
                    <td key={i} className="p-0.5">
                      <span
                        className={
                          "mx-auto flex h-8 w-8 items-center justify-center rounded-full nums " +
                          (on ? "bg-pine text-surface" : isToday ? "border-2 border-pine text-ink" : "text-sage")
                        }
                      >
                        {d.getDate()}
                        {on ? <span className="sr-only"> (done)</span> : null}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="grid grid-cols-2 gap-3 text-center sm:grid-cols-1" aria-live="polite">
          <div>
            <dt className="text-xs text-sage">Days in a row</dt>
            <dd className="font-serif text-3xl text-pine nums">{run}</dd>
          </div>
          <div>
            <dt className="text-xs text-sage">This month</dt>
            <dd className="font-serif text-3xl text-ink nums">{monthCount(days, today)}</dd>
          </div>
        </dl>
      </div>
      <p className="mt-4 text-xs text-sage">Kept on this phone only. Only Allah needs to know.</p>
    </section>
  );
}
