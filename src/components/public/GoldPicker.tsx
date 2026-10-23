"use client";

import { useState } from "react";
import {
  IconBangle,
  IconBracelet,
  IconChain,
  IconEarrings,
  IconGoldCoin,
  IconNecklace,
  IconNosePin,
  IconRing,
} from "@/components/icons";
import { GOLD_PIECES, MAX_PIECES, inUnit, piecesGrams, type GoldPieceKey } from "@/lib/gold-pieces";
import { fmt } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

const ICON: Record<GoldPieceKey, typeof IconRing> = {
  ring: IconRing,
  earrings: IconEarrings,
  nosePin: IconNosePin,
  chain: IconChain,
  bracelet: IconBracelet,
  bangle: IconBangle,
  necklace: IconNecklace,
  coin: IconGoldCoin,
};

/**
 * For someone who does not know what their gold weighs: tap the pieces they
 * have, see a rough total from typical weights, and use it as the weight.
 * Clearly an estimate, with a nudge to have the pieces weighed.
 */
export default function GoldPicker({
  m,
  unit,
  unitLabel,
  onUse,
}: {
  m: Messages["guide"]["picker"];
  unit: "g" | "tola";
  /** "g" or "tola", as written after a number. */
  unitLabel: string;
  onUse: (weight: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Partial<Record<GoldPieceKey, number>>>({});
  const grams = piecesGrams(counts);
  const shown = `${inUnit(grams, unit)} ${unitLabel}`;

  function change(key: GoldPieceKey, by: number) {
    setCounts((old) => ({ ...old, [key]: Math.max(0, Math.min(MAX_PIECES, (old[key] ?? 0) + by)) }));
  }

  if (!open) {
    return (
      <button
        type="button"
        className="text-sm font-medium text-pine underline-offset-2 hover:underline"
        onClick={() => setOpen(true)}
      >
        {m.dontKnow}
      </button>
    );
  }

  return (
    <section className="border border-brass/50 bg-brass/5 p-4" aria-label={m.title}>
      <p className="text-sm font-medium text-ink">{m.title}</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GOLD_PIECES.map(({ key, grams: each }) => {
          const Icon = ICON[key];
          const name = m.items[key];
          const n = counts[key] ?? 0;
          return (
            <li
              key={key}
              className={
                "flex flex-col items-center gap-1 border px-2 pb-2 pt-3 text-center " +
                (n > 0 ? "border-brass bg-surface" : "border-mist bg-paper/60")
              }
            >
              {/* Tapping the picture adds one too; the + button is the keyboard's way. */}
              <div className="flex cursor-pointer flex-col items-center gap-1" onClick={() => change(key, 1)}>
                <Icon className={"h-9 w-9 " + (n > 0 ? "text-brassDeep" : "text-sage")} />
                <span className="text-xs leading-snug text-ink">{name}</span>
                <span className="text-[13px] text-sage nums">
                  ~{inUnit(each, unit)} {unitLabel}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-mist text-lg text-ink disabled:opacity-40"
                  onClick={() => change(key, -1)}
                  disabled={n === 0}
                  aria-label={fmt(m.remove, { item: name })}
                >
                  −
                </button>
                <span className="w-6 text-center font-medium text-ink nums" aria-live="polite">
                  {n}
                </span>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-pine/40 text-lg text-pine"
                  onClick={() => change(key, 1)}
                  aria-label={fmt(m.add, { item: name })}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink nums" aria-live="polite">
            {fmt(m.estimate, { weight: shown })}
          </p>
          <p className="mt-0.5 text-xs text-sage">{m.hint}</p>
        </div>
        <button
          type="button"
          className="btn-primary px-4 py-2"
          disabled={grams === 0}
          onClick={() => {
            onUse(inUnit(grams, unit));
            setOpen(false);
          }}
        >
          {m.use}
        </button>
      </div>
    </section>
  );
}
