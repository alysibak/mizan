import Link from "next/link";
import { amountParam, formatMoney } from "@/lib/money";

export type CloseYearStep = "pay" | "freeze" | "roll" | "statement";

const STEPS: { id: CloseYearStep; label: string }[] = [
  { id: "pay", label: "Give" },
  { id: "freeze", label: "Close the year" },
  { id: "statement", label: "Print" },
];

/**
 * Closing a year in order: give what is left, close the year (a copy is kept
 * and the next year's count starts), print if wanted.
 */
export default function CloseYearPath({
  current,
  currency,
  outstanding = 0,
  latestSnapshotId = null,
  compact = false,
}: {
  current: CloseYearStep;
  currency: string;
  outstanding?: number;
  latestSnapshotId?: string | null;
  compact?: boolean;
}) {
  // Starting next year's count is part of closing it.
  const idx = STEPS.findIndex((s) => s.id === (current === "roll" ? "freeze" : current));

  return (
    <div className={compact ? "" : "mt-4"}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-sage">
        {STEPS.map((s, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <li key={s.id} className="flex items-center gap-2">
              {i > 0 ? <span className="text-sage" aria-hidden>→</span> : null}
              <span
                className={
                  active
                    ? "font-medium text-pine"
                    : done
                      ? "text-ink"
                      : "text-sage"
                }
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap gap-3">
        {current === "pay" && outstanding > 0 ? (
          <Link
            href={`/giving?type=zakat&amount=${amountParam(outstanding)}`}
            className="btn-primary"
          >
            I gave {formatMoney(outstanding, currency)} zakat
          </Link>
        ) : null}
        {current === "pay" && outstanding <= 0 ? (
          <Link href="/year#freeze-year" className="btn-primary">
            Close this year
          </Link>
        ) : null}
        {current === "freeze" ? (
          <>
            {outstanding > 0 ? (
              <Link
                href={`/giving?type=zakat&amount=${amountParam(outstanding)}`}
                className="btn-primary"
              >
                I gave {formatMoney(outstanding, currency)} zakat
              </Link>
            ) : null}
            {latestSnapshotId ? (
              <Link
                href={`/year/snapshots/${latestSnapshotId}`}
                className="btn-ghost"
              >
                Open the last copy
              </Link>
            ) : null}
          </>
        ) : null}
        {current === "roll" && latestSnapshotId ? (
          <Link
            href={`/year/snapshots/${latestSnapshotId}`}
            className="btn-primary"
          >
            Start next year’s count
          </Link>
        ) : null}
        {current === "roll" && !latestSnapshotId ? (
          <Link href="/year#freeze-year" className="btn-primary">
            Close the year first
          </Link>
        ) : null}
        {current === "statement" ? (
          <Link href="/statement" className="btn-primary">
            Print this year
          </Link>
        ) : null}
      </div>
    </div>
  );
}
