"use client";

import Link from "next/link";
import { FORGOTTEN_PROMPTS } from "@/lib/forgotten";
import { setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import ReckoningStepNav from "@/components/ReckoningStepNav";

const KEY = "mizan-forgotten-checked";

function parseChecked(raw: string | null): Record<string, boolean> {
  try {
    const value = raw ? JSON.parse(raw) : {};
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export default function ForgottenWealthTool() {
  const hydrated = useHydrated();
  const raw = useStoredValue(KEY);
  const checked = parseChecked(raw);

  function toggle(id: string) {
    setStoredValue(KEY, JSON.stringify({ ...checked, [id]: !checked[id] }));
  }

  const done = FORGOTTEN_PROMPTS.filter((p) => checked[p.id]).length;

  if (!hydrated) return null;

  return (
    <div className="space-y-8">
      <ReckoningStepNav current="forgotten" />

      <header>
        <p className="label text-brassDeep">Memory aid</p>
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
