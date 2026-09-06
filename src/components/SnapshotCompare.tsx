import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { parseSnapshotPayload } from "@/lib/snapshot";

type Snap = {
  id: string;
  label: string;
  takenAt: string;
  currency: string;
  payload: string;
};

export default function SnapshotCompare({ snaps }: { snaps: Snap[] }) {
  if (snaps.length < 2) return null;
  const newer = snaps[0];
  const older = snaps[1];
  const a = parseSnapshotPayload(newer.payload);
  const b = parseSnapshotPayload(older.payload);
  if (!a || !b) return null;

  const c = newer.currency;
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
