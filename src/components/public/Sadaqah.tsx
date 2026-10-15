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
import { useHydrated } from "@/lib/client-store";

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
