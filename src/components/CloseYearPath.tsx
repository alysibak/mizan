import Link from "next/link";
import { amountParam, formatMoney } from "@/lib/money";

export type CloseYearStep = "pay" | "freeze" | "roll" | "statement";

const STEPS: { id: CloseYearStep; label: string }[] = [
  { id: "pay", label: "Pay" },
  { id: "freeze", label: "Freeze" },
  { id: "roll", label: "Roll hawl" },
  { id: "statement", label: "Statement" },
];

/**
 * Ordered close path: pay outstanding → freeze snapshot → roll hawl → print.
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
  const idx = STEPS.findIndex((s) => s.id === current);

  return (
    <div className={compact ? "" : "mt-4"}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-sage">
        {STEPS.map((s, i) => {
          const active = s.id === current;
          const done = i < idx;
          return (
            <li key={s.id} className="flex items-center gap-2">
              {i > 0 ? <span className="text-mist" aria-hidden>→</span> : null}
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
            Record {formatMoney(outstanding, currency)} zakat
          </Link>
        ) : null}
        {current === "pay" && outstanding <= 0 ? (
          <Link href="/year#freeze-year" className="btn-primary">
            Freeze this reckoning
          </Link>
        ) : null}
        {current === "freeze" ? (
          <>
            {outstanding > 0 ? (
              <Link
                href={`/giving?type=zakat&amount=${amountParam(outstanding)}`}
                className="btn-primary"
              >
                Record {formatMoney(outstanding, currency)} zakat
              </Link>
            ) : (
              <a href="#freeze-year" className="btn-primary">
                Freeze below
              </a>
            )}
            {latestSnapshotId ? (
              <Link
                href={`/year/snapshots/${latestSnapshotId}`}
                className="btn-ghost"
              >
                Open last freeze
              </Link>
            ) : null}
          </>
        ) : null}
        {current === "roll" && latestSnapshotId ? (
          <Link
            href={`/year/snapshots/${latestSnapshotId}`}
            className="btn-primary"
          >
            Roll hawl on snapshot
          </Link>
        ) : null}
        {current === "roll" && !latestSnapshotId ? (
          <Link href="/year#freeze-year" className="btn-primary">
            Freeze first
          </Link>
        ) : null}
        {current === "statement" ? (
          <Link href="/statement" className="btn-primary">
            Print statement
          </Link>
        ) : null}
        {current !== "statement" ? (
          <Link href="/statement" className="text-sm text-pine hover:underline">
            Statement anytime
          </Link>
        ) : null}
      </div>
    </div>
  );
}
