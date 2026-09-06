import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { yearSnapshots } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { parseSnapshotPayload } from "@/lib/snapshot";
import { formatMoney, formatPercent } from "@/lib/money";
import { categoryMeta } from "@/lib/categories";
import DeleteSnapshotButton from "@/components/DeleteSnapshotButton";
import PrintButton from "@/components/PrintButton";
import RollHawlButton from "@/components/RollHawlButton";

type Ctx = { params: Promise<{ id: string }> };

export default async function SnapshotPage({ params }: Ctx) {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  const { id } = await params;
  const [row] = await db
    .select()
    .from(yearSnapshots)
    .where(and(eq(yearSnapshots.id, id), eq(yearSnapshots.userId, user.id)))
    .limit(1);
  if (!row) notFound();

  const payload = parseSnapshotPayload(row.payload);
  if (!payload) notFound();

  const c = row.currency;
  const r = payload.result;

  return (
    <div className="document-print space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-serif text-2xl text-ink print:text-3xl">Mizan</p>
          <p className="label mt-3 text-brass">Frozen reckoning</p>
          <h1 className="mt-1 font-serif text-3xl text-ink">{row.label}</h1>
          <p className="mt-2 text-sm text-sage">Taken {row.takenAt}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link href="/statement" className="btn-primary">
            Print statement
          </Link>
          <PrintButton />
          <Link href="/year" className="btn-ghost">
            Back to year
          </Link>
          <DeleteSnapshotButton id={row.id} />
        </div>
      </header>

      {payload.letterToNextYear ? (
        <section className="border border-brass/40 bg-brass/5 px-5 py-6">
          <p className="label text-brass">Letter from that night</p>
          <p className="mt-3 whitespace-pre-wrap font-serif text-lg leading-relaxed text-ink">
            {payload.letterToNextYear}
          </p>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="font-serif text-lg text-ink">The sum</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="ledger-row">
            <dt className="text-sage">Net zakatable</dt>
            <dd className="nums">{formatMoney(r.netZakatable, c)}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">Nisab ({payload.settings.nisabStandard})</dt>
            <dd className="nums">{formatMoney(r.nisab, c)}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-ink">Zakat at freeze</dt>
            <dd className="font-serif text-xl nums text-pine">
              {r.isDue ? formatMoney(r.zakatDue, c) : "None — below nisab"}
            </dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">
              Rate ({formatPercent(r.rate, r.basis === "solar" ? 3 : 1)})
            </dt>
            <dd className="nums text-sage">{r.basis}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">Zakat recorded ({payload.givingYtd.year})</dt>
            <dd className="nums">{formatMoney(payload.givingYtd.zakat, c)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h2 className="font-serif text-lg text-ink">Holdings at freeze</h2>
        {payload.assets.length === 0 ? (
          <p className="mt-3 text-sm text-sage">No assets on this snapshot.</p>
        ) : (
          <ul className="mt-3">
            {payload.assets.map((a, i) => (
              <li key={i} className="ledger-row">
                <div>
                  <p className="text-ink">{a.label}</p>
                  <p className="text-xs text-sage">{categoryMeta(a.category).label}</p>
                </div>
                <p className="nums">{formatMoney(a.amount, c)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel print:hidden">
        <h2 className="font-serif text-lg text-ink">Start the next cycle</h2>
        <p className="mt-2 text-sm text-sage">
          After you pay and freeze, roll the ledger hawl forward so the next
          year begins counting. Then print a statement if you want paper.
        </p>
        <div className="mt-4">
          <RollHawlButton settings={settings} />
        </div>
      </section>

      <p className="text-xs text-sage">
        This is a historical copy. Changing your live ledger does not alter it.
      </p>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Link href="/statement" className="btn-primary">
          Open live statement
        </Link>
        <Link href="/dashboard" className="btn-ghost">
          Back to Balance
        </Link>
      </div>
    </div>
  );
}
