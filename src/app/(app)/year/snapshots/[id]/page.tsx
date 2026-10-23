import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { yearSnapshots } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { loadReckoning } from "@/lib/reckoning";
import { parseSnapshotPayload } from "@/lib/snapshot";
import { isoDay, readableDay } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/money";
import { categoryMeta } from "@/lib/categories";
import DeleteSnapshotButton from "@/components/DeleteSnapshotButton";
import PrintButton from "@/components/PrintButton";
import RollHawlButton from "@/components/RollHawlButton";

type Ctx = { params: Promise<{ id: string }> };

export default async function SnapshotPage({ params }: Ctx) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const [[row], reckoning] = await Promise.all([
    db
      .select()
      .from(yearSnapshots)
      .where(and(eq(yearSnapshots.id, id), eq(yearSnapshots.userId, user.id)))
      .limit(1),
    loadReckoning(user.id),
  ]);
  if (!row) notFound();

  const payload = parseSnapshotPayload(row.payload);
  if (!payload) notFound();

  const c = row.currency;
  const r = payload.result;
  const { hawl, latestFreeze, frozenThisCycle } = reckoning;
  // Rolling belongs to the freeze that closed the current cycle, once that
  // hawl is complete. Older freezes are history only.
  const closesCurrentCycle = latestFreeze?.id === row.id && frozenThisCycle;
  const windowLabel =
    payload.givingYtd.windowStart && payload.givingYtd.windowEnd
      ? `${payload.givingYtd.windowStart} → ${payload.givingYtd.windowEnd}`
      : String(payload.givingYtd.year);

  const nextYear = (
    <section className={"print:hidden " + (closesCurrentCycle ? "border border-pine/40 bg-pine/5 px-5 py-5" : "panel")}>
      <h2 className="font-serif text-lg text-ink">Start next year’s count</h2>
      <p className="mt-2 text-sm text-sage">
        Once you have given your zakat and kept this copy, start counting the
        next zakat year.
      </p>
      <div className="mt-4">
        {!hawl ? (
          <p className="text-sm text-sage">
            First{" "}
            <Link href="/settings#zakat-day" className="text-pine hover:underline">
              set your zakat day
            </Link>
            .
          </p>
        ) : !closesCurrentCycle ? (
          <p className="text-sm text-sage">
            This copy is from an earlier year. Your current zakat year began{" "}
            {isoDay(hawl.startDate)}.
          </p>
        ) : hawl.isComplete ? (
          <RollHawlButton nextStart={isoDay(hawl.dueDate)} />
        ) : (
          <p className="text-sm text-sage">
            This zakat year runs until {isoDay(hawl.dueDate)}. You can start the
            next one on that day.
          </p>
        )}
      </div>
    </section>
  );

  return (
    <div className="document-print space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-serif text-2xl text-ink print:text-3xl">Mizan</p>
          <p className="eyebrow mt-3">A year you kept</p>
          <h1 className="mt-1 font-serif text-3xl text-ink">{row.label}</h1>
          <p className="mt-2 text-sm text-sage">Kept on {readableDay(row.takenAt)}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <Link href="/year" className="btn-ghost">
            Back
          </Link>
          <DeleteSnapshotButton id={row.id} />
        </div>
      </header>

      {closesCurrentCycle ? nextYear : null}

      {payload.letterToNextYear ? (
        <section className="border border-brass/40 bg-brass/5 px-5 py-6">
          <p className="eyebrow">Your note</p>
          <p className="mt-3 whitespace-pre-wrap font-serif text-lg leading-relaxed text-ink">
            {payload.letterToNextYear}
          </p>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="font-serif text-lg text-ink">The figures</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="ledger-row">
            <dt className="text-sage">What counted, after debts</dt>
            <dd className="nums">{formatMoney(r.netZakatable, c)}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">The minimum (nisab, by {payload.settings.nisabStandard})</dt>
            <dd className="nums">{formatMoney(r.nisab, c)}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-ink">Zakat</dt>
            <dd className="font-serif text-xl nums text-pine">
              {r.isDue ? formatMoney(r.zakatDue, c) : "None: below the minimum"}
            </dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">
              Rate ({formatPercent(r.rate, r.basis === "solar" ? 3 : 1)})
            </dt>
            <dd className="nums text-sage">{r.basis === "solar" ? "solar year" : "lunar year"}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">Zakat given ({windowLabel})</dt>
            <dd className="nums">{formatMoney(payload.givingYtd.zakat, c)}</dd>
          </div>
          {payload.givingYtd.fitr ? (
            <div className="ledger-row">
              <dt className="text-sage">Zakat al-Fitr given</dt>
              <dd className="nums">{formatMoney(payload.givingYtd.fitr, c)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="panel">
        <h2 className="font-serif text-lg text-ink">What you owned then</h2>
        {payload.assets.length === 0 ? (
          <p className="mt-3 text-sm text-sage">Nothing was added that year.</p>
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

      {closesCurrentCycle ? null : nextYear}

      <p className="text-xs text-sage">
        This copy stays as it was. Changing what you own today does not change it.
      </p>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Link href="/dashboard" className="btn-ghost">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
