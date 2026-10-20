"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import { MY_KEY, daysUntil, nextZakatDay, parseMy } from "@/lib/my-zakat";

const DISMISSED_KEY = "mizan-zakat-day-notice";
/** How many days ahead the notice starts showing. */
const AHEAD = 14;

/**
 * A line at the top of every page once the visitor's zakat day is near, so
 * the site reminds them rather than waiting to be opened. Dismissed until
 * the next zakat day. English only, like My zakat.
 */
export default function ZakatDayNotice() {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const my = parseMy(useStoredValue(MY_KEY));
  const dismissed = useStoredValue(DISMISSED_KEY);
  if (!hydrated || !my.zakatDay || pathname === "/my") return null;
  const today = new Date();
  const next = nextZakatDay(my.zakatDay, today);
  const day = next.toISOString().slice(0, 10);
  const left = daysUntil(next, today);
  if (left > AHEAD || dismissed === day) return null;

  return (
    <div className="relative z-40 flex items-center gap-3 bg-pine px-5 py-2.5 text-sm text-surface print:hidden" role="status">
      <p className="min-w-0 flex-1">
        <span className="font-medium">
          {left === 0 ? "Today is your zakat day." : `Your zakat day is in ${left} ${left === 1 ? "day" : "days"}.`}
        </span>{" "}
        <Link href="/my" className="whitespace-nowrap font-medium underline underline-offset-2">
          Open My zakat
        </Link>
      </p>
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center text-xl leading-none text-surface/80 hover:text-surface"
        aria-label="Hide until next year"
        onClick={() => setStoredValue(DISMISSED_KEY, day)}
      >
        ×
      </button>
    </div>
  );
}
