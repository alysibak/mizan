import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { SnapshotPayload } from "@/lib/snapshot";

type Freeze = {
  id: string;
  label: string;
  takenAt: string;
  payload: SnapshotPayload | null;
};

export default function SnapshotCompare({ freezes }: { freezes: Freeze[] }) {
  if (freezes.length < 2) return null;
  const newer = freezes[0];
  const older = freezes[1];
  const a = newer.payload;
  const b = older.payload;
  if (!a || !b) return null;
  // Differences across currencies would be meaningless.
  if (a.settings.currency !== b.settings.currency) return null;

  const c = a.settings.currency;
  const rows = [
    {
      label: "Net zakatable",
      next: a.result.netZakatable,
      prev: b.result.netZakatable,
    },
    {
      label: "Zakat at freeze",
      next: a.result.zakatDue,
      prev: b.result.zakatDue,
    },
    {
      label: "Zakat recorded",
      next: a.givingYtd.zakat,
      prev: b.givingYtd.zakat,
    },
  ];

  return (
    <section className="panel">
      <h2 className="font-serif text-xl text-ink">Compare last two freezes</h2>
      <p className="mt-1 text-sm text-sage">
        {older.label} ({older.takenAt}) → {newer.label} ({newer.takenAt})
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        {rows.map((row) => {
          const delta = row.next - row.prev;
          return (
            <div key={row.label} className="ledger-row">
              <dt className="text-sage">{row.label}</dt>
              <dd className="text-right">
                <span className="nums">{formatMoney(row.next, c)}</span>
                <span
                  className={
                    "ml-3 text-xs nums " +
                    (delta > 0 ? "text-gain" : delta < 0 ? "text-danger" : "text-sage")
                  }
                >
                  {delta > 0 ? "+" : ""}
                  {formatMoney(delta, c)}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-3 text-xs text-sage">
        <Link href={`/year/snapshots/${older.id}`} className="text-pine hover:underline">
          Open older
        </Link>
        <span className="mx-2 text-mist">·</span>
        <Link href={`/year/snapshots/${newer.id}`} className="text-pine hover:underline">
          Open newer
        </Link>
      </p>
    </section>
  );
}
