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
      <header>
        <p className="eyebrow">Close the year · step 1 of 3</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Anything you forgot?</h1>
        <p className="mt-2 max-w-xl text-base text-sage">
          People often forget these. Tick each one once you have thought about
          it, and add anything you own on “What I own”.
        </p>
      </header>

      <p className="text-sm text-sage">
        {done} of {FORGOTTEN_PROMPTS.length} thought about
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
                  Add it to what I own
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
