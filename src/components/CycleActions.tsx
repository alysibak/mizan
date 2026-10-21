import Link from "next/link";
import { amountParam, formatMoney } from "@/lib/money";
import type { DuePhase } from "@/lib/giving-window";

/**
 * One way to finish a year everywhere: give, keep a copy, start the next
 * year's count, print if wanted.
 */
export default function CycleActions({
  currency,
  outstanding,
  phase,
  compact = false,
  latestSnapshotId = null,
  frozenThisCycle = false,
}: {
  currency: string;
  outstanding: number;
  phase: DuePhase;
  compact?: boolean;
  latestSnapshotId?: string | null;
  /** True when a snapshot already exists for this payment window. */
  frozenThisCycle?: boolean;
}) {
  if (phase === "below_nisab") return null;

  const wrap = compact ? "flex flex-wrap gap-3" : "mt-4 flex flex-wrap gap-3";

  if (phase === "unverified") {
    return (
      <div className={wrap}>
        <Link href="/settings#metal-prices" className="btn-primary">
          Set today’s gold and silver prices
        </Link>
      </div>
    );
  }

  if (phase === "indicative") {
    return (
      <div className={wrap}>
        <Link href="/year" className="btn-primary">
          See this year’s zakat
        </Link>
      </div>
    );
  }

  if (outstanding > 0) {
    return (
      <div className={wrap}>
        <Link
          href={`/giving?type=zakat&amount=${amountParam(outstanding)}`}
          className="btn-primary"
        >
          I gave {formatMoney(outstanding, currency)} zakat
        </Link>
      </div>
    );
  }

  if (frozenThisCycle && latestSnapshotId) {
    return (
      <div className={wrap}>
        <Link
          href={`/year/snapshots/${latestSnapshotId}`}
          className="btn-primary"
        >
          Start next year’s count
        </Link>
        <Link href="/statement" className="btn-ghost">
          Print this year
        </Link>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <Link href="/year#freeze-year" className="btn-primary">
        Keep a copy of this year
      </Link>
      <Link href="/statement" className="btn-ghost">
        Print this year
      </Link>
      <p className="basis-full text-xs text-sage">
        Then start next year’s count from the copy.
      </p>
    </div>
  );
}
