"use client";

import { useId } from "react";
import Link from "next/link";
import { IconCamel, IconCow, IconGoat, IconPump, IconRain, IconSack } from "@/components/icons";
import { AmountWords } from "@/components/ZakatCalculator";
import { parseAmount } from "@/lib/calculator";
import {
  CROP_NISAB_KG,
  FARM_KEY,
  HERD_NISAB,
  HERD_STEPS,
  MAUND_KG,
  cropZakat,
  herdStep,
  herdZakat,
  parseFarm,
  type Due,
  type Given,
  type Herd,
  type Watering,
} from "@/lib/farm";
import { amountInWords } from "@/lib/number-words";
import { useStoredState } from "@/lib/client-store";

const INTL = "en-CA";
const number = (n: number) => n.toLocaleString(INTL, { maximumFractionDigits: 1 });

const WATERING: { key: Watering; title: string; detail: string; Icon: typeof IconRain; share: string }[] = [
  {
    key: "rain",
    title: "Rain, a river, or a spring",
    detail: "Water that cost you nothing to bring.",
    Icon: IconRain,
    share: "a tenth",
  },
  {
    key: "irrigated",
    title: "A pump, a well, or bought water",
    detail: "Water you paid for or worked to bring.",
    Icon: IconPump,
    share: "half a tenth",
  },
  {
    key: "both",
    title: "Both, about half and half",
    detail: "Some of the season by rain, some by your own water.",
    Icon: IconRain,
    share: "three quarters of a tenth",
  },
];

const HERDS: { key: Herd; title: string; hint: string; Icon: typeof IconGoat }[] = [
  { key: "sheep", title: "Sheep and goats", hint: "Counted together", Icon: IconGoat },
  { key: "cattle", title: "Cows and buffalo", hint: "Counted together", Icon: IconCow },
  { key: "camels", title: "Camels", hint: "", Icon: IconCamel },
];

/** What each animal given is, by its age, as the hadith names it. */
const GIVEN: Record<Given, { name: (n: number) => string; what: string; Icon: typeof IconGoat }> = {
  sheep: { name: (n) => (n === 1 ? "sheep or goat" : "sheep or goats"), what: "healthy, about a year old", Icon: IconGoat },
  tabi: { name: () => "tabi‘", what: "a calf in its second year, male or female", Icon: IconCow },
  musinnah: { name: () => "musinnah", what: "a cow in its third year", Icon: IconCow },
  bintMakhad: { name: () => "bint makhad", what: "a she-camel in its second year", Icon: IconCamel },
  bintLabun: { name: () => "bint labun", what: "a she-camel in its third year", Icon: IconCamel },
  hiqqah: { name: () => "hiqqah", what: "a she-camel in its fourth year", Icon: IconCamel },
  jadhaah: { name: () => "jadha‘ah", what: "a she-camel in its fifth year", Icon: IconCamel },
};

function dueText(dues: Due[]): string {
  return dues.map((d) => `${d.count} ${GIVEN[d.given].name(d.count)}`).join(" and ");
}

/** A grain sack, about 10 wide and 12 tall, from y 1.5 to 13.7. */
const SACK =
  "M7.2 1.5h4.6l-1 2.4c2 1.1 3.3 3.3 3.3 5.8 0 2.5-1.7 4-4.6 4s-4.6-1.5-4.6-4c0-2.5 1.3-4.7 3.3-5.8l-1-2.4Z";

/** Ten sacks of the harvest, with the share that is given filled in. */
function SackRow({ rate }: { rate: number }) {
  const clip = useId();
  const filled = rate * 10;
  const part = filled === 1 ? "one" : filled === 0.5 ? "half of one" : "three quarters of one";
  return (
    <svg viewBox="0 0 250 34" className="h-auto w-full max-w-sm" role="img" aria-label={`Of every ten sacks, ${part} is given`}>
      <defs>
        <clipPath id={clip}>
          <rect x="0" y={13.7 - 12.2 * filled} width="20" height={12.2 * filled} />
        </clipPath>
      </defs>
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i} transform={`translate(${i * 25 - 9} 1) scale(2.2)`}>
          <path d={SACK} strokeWidth="0.6" className={i === 0 ? "fill-brass/15 stroke-brassDeep" : "fill-none stroke-sage/60"} />
          {i === 0 ? <path d={SACK} className="fill-brass" clipPath={`url(#${clip})`} /> : null}
        </g>
      ))}
    </svg>
  );
}

/**
 * Zakat on a farm: the harvest by weight and how it was watered, and each
 * kind of grazing animal by count, each answer drawn as pictures. English
 * only; kept in this browser for My zakat, never sent.
 */
export default function FarmPlanner() {
  // Kept in this browser, so My zakat can show what the farm owes.
  const [farm, saveFarm] = useStoredState(FARM_KEY, parseFarm);
  const { harvest, unit, watering, counts, grazing } = farm;
  const setHarvest = (v: string) => saveFarm({ ...farm, harvest: v });
  const setUnit = (v: "kg" | "maund") => saveFarm({ ...farm, unit: v });
  const setWatering = (v: Watering) => saveFarm({ ...farm, watering: v });
  const setGrazing = (v: boolean) => saveFarm({ ...farm, grazing: v });
  const setCount = (herd: Herd, v: string) => saveFarm({ ...farm, counts: { ...counts, [herd]: v } });

  const kg = parseAmount(harvest, ".") * (unit === "maund" ? MAUND_KG : 1);
  const crop = cropZakat(kg, watering);
  const inUnit = (k: number) => (unit === "maund" ? `${number(k / MAUND_KG)} maund (${number(k)} kg)` : `${number(k)} kg`);
  const share = WATERING.find((w) => w.key === watering)!.share;

  return (
    <div className="space-y-8">
      <section className="card space-y-5 p-5 sm:p-6" aria-labelledby="crops-title">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine" aria-hidden>
            <IconSack className="h-6 w-6" />
          </span>
          <div>
            <h2 id="crops-title" className="font-serif text-2xl text-ink">
              Your harvest
            </h2>
            <p className="mt-1 text-sm text-sage">Grain, rice, dates, raisins: weigh it once it is dry and cleaned.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div>
            <label className="label mb-1.5" htmlFor="farm-harvest">
              How much did you harvest?
            </label>
            <input
              id="farm-harvest"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              className="field nums"
              value={harvest}
              onChange={(e) => setHarvest(e.target.value)}
              aria-describedby="farm-harvest-words"
            />
            <AmountWords id="farm-harvest-words" words={amountInWords(parseAmount(harvest, "."), INTL)} />
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="farm-unit">
              Weighed in
            </label>
            <select id="farm-unit" className="field" value={unit} onChange={(e) => setUnit(e.target.value as "kg" | "maund")}>
              <option value="kg">kilograms (kg)</option>
              <option value="maund">maund (40 kg)</option>
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="label mb-2">How was the land watered?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {WATERING.map(({ key, title, detail, Icon }) => (
              <label
                key={key}
                className={
                  "flex cursor-pointer flex-col items-center gap-1.5 border px-3 py-3 text-center transition " +
                  (watering === key ? "border-pine bg-pine/5" : "border-mist hover:border-sage")
                }
              >
                <input
                  type="radio"
                  name="farm-watering"
                  className="sr-only"
                  checked={watering === key}
                  onChange={() => setWatering(key)}
                />
                <span className={"flex items-center gap-1 " + (watering === key ? "text-pine" : "text-sage")} aria-hidden>
                  <Icon className="h-8 w-8" />
                  {key === "both" ? <IconPump className="h-8 w-8" /> : null}
                </span>
                <span className="text-sm font-medium text-ink">{title}</span>
                <span className="text-xs text-sage">{detail}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {kg > 0 ? (
          <div className="border-t border-mist pt-4" aria-live="polite">
            {crop.due ? (
              <>
                <p className="font-serif text-2xl text-pine nums">Give {inUnit(crop.kg)}</p>
                <p className="mt-1 text-sm text-sage">
                  That is {share} of {inUnit(kg)}, given at harvest. No year needs to pass. You can give the crop
                  itself, or (in the Hanafi school) its value.
                </p>
                <div className="mt-3">
                  <SackRow rate={crop.rate} />
                </div>
              </>
            ) : (
              <>
                <p className="font-serif text-2xl text-ink">Below the nisab</p>
                <p className="mt-1 text-sm text-sage nums">
                  {inUnit(kg)} is under five awsuq, about {number(CROP_NISAB_KG)} kg, so most scholars ask no zakat on
                  this harvest. The Hanafi school asks {share} of any harvest, however small.
                </p>
              </>
            )}
          </div>
        ) : null}
      </section>

      <section className="card space-y-5 p-5 sm:p-6" aria-labelledby="animals-title">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine" aria-hidden>
            <IconGoat className="h-6 w-6" />
          </span>
          <div>
            <h2 id="animals-title" className="font-serif text-2xl text-ink">
              Your animals
            </h2>
            <p className="mt-1 text-sm text-sage">
              Count the ones you have owned for a full Islamic year, young ones born to them included.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {HERDS.map(({ key, title, hint, Icon }) => (
            <div key={key} className="border border-mist px-3 pb-3 pt-2">
              <label htmlFor={`farm-${key}`} className="flex items-center gap-2 text-sm font-medium text-ink">
                <Icon className="h-8 w-8 text-sage" />
                <span>
                  {title}
                  {hint ? <span className="block text-xs font-normal text-sage">{hint}</span> : null}
                </span>
              </label>
              <input
                id={`farm-${key}`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                className="field mt-2 nums"
                value={counts[key]}
                onChange={(e) => setCount(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <fieldset>
          <legend className="label mb-2">For most of the year, did they…</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { value: true, title: "Graze on open land", detail: "Pasture you did not pay for." },
              { value: false, title: "Eat feed you bought or grew", detail: "Or work: ploughing, carrying, pulling." },
            ].map((o) => (
              <label
                key={String(o.value)}
                className={
                  "flex cursor-pointer gap-3 border px-3 py-2.5 transition " +
                  (grazing === o.value ? "border-pine bg-pine/5" : "border-mist hover:border-sage")
                }
              >
                <input
                  type="radio"
                  name="farm-grazing"
                  checked={grazing === o.value}
                  onChange={() => setGrazing(o.value)}
                  className="mt-1 accent-[rgb(var(--c-pine))]"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">{o.title}</span>
                  <span className="block text-xs text-sage">{o.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {grazing ? (
          <div className="space-y-4">
            {HERDS.map(({ key, title }) => {
              const n = Math.floor(parseAmount(counts[key], "."));
              if (!(n > 0)) return null;
              const dues = herdZakat(key, n);
              const step = herdStep(key, n);
              return (
                <div key={key} className="border-t border-mist pt-4" aria-live="polite">
                  <p className="text-sm text-sage">
                    {title}: <span className="nums">{number(n)}</span>
                  </p>
                  {dues.length ? (
                    <>
                      <p className="font-serif text-2xl text-pine nums">Give {dueText(dues)}</p>
                      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                        {dues.map((d) => {
                          const { Icon, what } = GIVEN[d.given];
                          return (
                            <li key={d.given} className="flex items-center gap-2 text-sm text-ink">
                              <span className="flex" aria-hidden>
                                {Array.from({ length: Math.min(d.count, 6) }, (_, i) => (
                                  <Icon key={i} className="-me-1 h-8 w-8 text-brassDeep" />
                                ))}
                                {d.count > 6 ? <span className="ms-2 self-center text-sm text-sage nums">×{d.count}</span> : null}
                              </span>
                              <span className="text-xs text-sage">{what}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <p className="font-serif text-xl text-ink">
                      Nothing yet: zakat starts at {HERD_NISAB[key]}
                    </p>
                  )}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-pine">See the whole table</summary>
                    <ol className="mt-2 divide-y divide-mist border border-mist text-sm">
                      {HERD_STEPS[key].map((s, i) => (
                        <li
                          key={s.from}
                          className={"flex justify-between gap-3 px-3 py-1.5 " + (i === step ? "bg-brass/10 font-medium text-ink" : "text-sage")}
                          aria-current={i === step ? "true" : undefined}
                        >
                          <span className="nums">
                            {s.to === null ? `${s.from} and more` : `${s.from} to ${s.to}`}
                          </span>
                          <span className="text-end">
                            {s.to === null
                              ? key === "sheep"
                                ? "1 for every 100"
                                : key === "cattle"
                                  ? "1 tabi‘ for every 30, 1 musinnah for every 40"
                                  : "1 bint labun for every 40, 1 hiqqah for every 50"
                              : key === "camels" && s.from === 5
                                ? "1 sheep or goat for every 5"
                                : dueText(s.dues)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </details>
                </div>
              );
            })}
            <p className="text-xs leading-relaxed text-sage">
              Give a healthy animal of the right age: not the best of the herd, and not an old, sick, or injured
              one.
            </p>
          </div>
        ) : (
          <p className="border-t border-mist pt-4 text-sm leading-relaxed text-sage">
            Most scholars ask no zakat on animals you feed for most of the year, or keep for work; Imam Malik
            counts them too. Animals you keep <strong className="font-medium text-ink">to sell</strong> are trade
            goods instead: count what they would sell for in the{" "}
            <Link href="/calculator" className="text-pine hover:underline">
              calculator
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
