import Link from "next/link";
import { amountParam, formatMoney } from "@/lib/money";
import type { DuePhase } from "@/lib/giving-window";

/**
 * One finish story everywhere: pay → freeze → roll hawl → statement.
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
          Set today’s metal prices
        </Link>
      </div>
    );
  }

  if (phase === "indicative") {
    return (
      <div className={wrap}>
        <Link href="/year" className="btn-primary">
          Open The year
        </Link>
        <Link href="/tools/reckoning-night" className="btn-ghost">
          Reckoning night
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
          Record {formatMoney(outstanding, currency)} zakat
        </Link>
        <Link href="/year#freeze-year" className="btn-ghost">
          Freeze after you pay
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
          Roll hawl → next cycle
        </Link>
        <Link href="/statement" className="btn-ghost">
          Print statement
        </Link>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <Link href="/year#freeze-year" className="btn-primary">
        Freeze this reckoning
      </Link>
      <Link href="/statement" className="btn-ghost">
        Print statement
      </Link>
      <p className="basis-full text-xs text-sage">
        After freeze: roll the ledger hawl on the snapshot, then print if you
        want paper.
      </p>
    </div>
  );
}
