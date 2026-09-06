"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FORGOTTEN_PROMPTS } from "@/lib/forgotten";
import ReckoningStepNav from "@/components/ReckoningStepNav";

const KEY = "mizan-forgotten-checked";

export default function ForgottenWealthTool() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const done = FORGOTTEN_PROMPTS.filter((p) => checked[p.id]).length;

  if (!ready) return null;

  return (
    <div className="space-y-8">
      <ReckoningStepNav current="forgotten" />

      <header>
        <p className="label text-brass">Memory aid</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Forgotten wealth</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          Check what you have reviewed. Add anything real on the ledger, then
          continue the sitting.
        </p>
      </header>

      <p className="text-sm text-sage">
        Reviewed {done} of {FORGOTTEN_PROMPTS.length}
      </p>

      <ul className="divide-y divide-mist border-y border-mist">
        {FORGOTTEN_PROMPTS.map((p) => (
          <li key={p.id} className="flex gap-4 py-5">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-pine"
              checked={Boolean(checked[p.id])}
              onChange={() => toggle(p.id)}
              aria-label={p.label}
            />
            <div className="min-w-0 flex-1">
              <p
                className={
                  "font-serif text-lg " +
                  (checked[p.id] ? "text-sage line-through" : "text-ink")
                }
              >
                {p.label}
              </p>
              <p className="mt-1 text-sm text-sage">{p.hint}</p>
              {p.categoryHint && !checked[p.id] ? (
                <Link
                  href={`/assets?category=${encodeURIComponent(p.categoryHint)}&label=${encodeURIComponent(p.label)}`}
                  className="mt-2 inline-block text-sm text-pine hover:underline"
                >
                  Add on ledger
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <ReckoningStepNav current="forgotten" />
    </div>
  );
}
