import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { yearSnapshots } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { loadReckoning } from "@/lib/reckoning";
import { hawlStatus, formatHijri } from "@/lib/hijri";
import { isIsoDay, isoDay } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/money";
import FreezeYearButton from "@/components/FreezeYearButton";
import SnapshotCompare from "@/components/SnapshotCompare";
import { MADHHAB_LABELS, parseMadhhab } from "@/lib/madhhab";
import EstimateBanner from "@/components/EstimateBanner";
import HawlCalendarLink from "@/components/HawlCalendarLink";
import HawlRestart from "@/components/HawlRestart";
import CycleActions from "@/components/CycleActions";
import CloseYearPath from "@/components/CloseYearPath";
import ReckoningStepNav from "@/components/ReckoningStepNav";

export default async function YearPage({
  searchParams,
}: {
  searchParams: Promise<{ rolled?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { rolled } = await searchParams;
  const [reckoning, snaps] = await Promise.all([
    loadReckoning(user.id),
    db
      .select({
        id: yearSnapshots.id,
        label: yearSnapshots.label,
        takenAt: yearSnapshots.takenAt,
        currency: yearSnapshots.currency,
      })
      .from(yearSnapshots)
      .where(eq(yearSnapshots.userId, user.id))
      .orderBy(desc(yearSnapshots.takenAt), desc(yearSnapshots.createdAt)),
  ]);
  const {
    settings,
    assets: assetRows,
    result,
    window,
    zakatPaid,
    outstanding,
    phase,
    hawl,
    latestFreeze,
    recentFreezes,
    frozenThisCycle,
    today,
    calendar,
  } = reckoning;
  const madhhab = parseMadhhab(settings.madhhab);
  const c = settings.currency;
  const dueNow = phase === "payable" && outstanding > 0;
  const cycleMet =
    phase === "payable" && result.isDue && outstanding === 0 && zakatPaid > 0;
  const freezeLabel =
    window.kind === "hawl"
      ? `Hawl ${window.cycleStart}`
      : `Zakat ${window.cycleStart.slice(0, 4)}`;

  const perAssetHawl = assetRows
    .filter((a) => a.hawlStartDate && isIsoDay(a.hawlStartDate))
    .map((a) => ({
      id: a.id,
      label: a.label,
      status: hawlStatus(a.hawlStartDate!, today, calendar),
    }))
    .sort((a, b) => a.status.remainingDays - b.status.remainingDays);

  const anyAssetDue = perAssetHawl.some((a) => a.status.isComplete);
  const latestSnapshotId = latestFreeze?.id ?? null;
  const closeStep =
    outstanding > 0 ? "pay" : frozenThisCycle ? "roll" : "freeze";

  return (
    <div className="space-y-10">
      <header>
        <p className="label text-brassDeep">Hawl and reckoning</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">The year</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          Track the holding year, see what is payable, print a statement, and
          freeze a copy when you pay. School: {MADHHAB_LABELS[madhhab]}.
        </p>
      </header>

      {rolled && isIsoDay(rolled) && hawl && isoDay(hawl.startDate) === rolled ? (
        <section className="border border-pine/40 bg-pine/5 px-5 py-5" role="status">
          <p className="label text-pine">Hawl rolled</p>
          <p className="mt-1 font-serif text-xl text-ink">Next hawl starts {rolled}.</p>
          <p className="mt-1 text-sm text-sage">
            Confirm the real payment day with local moon-sighting. Print last
            year&apos;s statement from the frozen copy if you want paper.
          </p>
          <Link href="/statement" className="btn-ghost mt-3">
            Open statement
          </Link>
        </section>
      ) : null}

      <EstimateBanner />

      {cycleMet && (
        <section className="border border-pine bg-pine/5 px-5 py-6">
          <p className="label text-pine">Cycle met</p>
          <p className="mt-2 font-serif text-2xl text-ink">
            Zakat for this cycle is recorded.
          </p>
          <p className="mt-2 text-sm text-sage">
            Seal the numbers, roll the ledger hawl, then print if you want paper.
          </p>
          <CycleActions
            currency={c}
            outstanding={0}
            phase="payable"
            latestSnapshotId={latestSnapshotId}
            frozenThisCycle={frozenThisCycle}
          />
        </section>
      )}

      {(dueNow || (anyAssetDue && phase === "payable" && outstanding > 0)) && (
        <section className="border border-pine bg-pine/5 px-5 py-6">
          <p className="label text-pine">
            {dueNow ? "Ledger hawl is complete" : "A holding’s reminder hawl is complete"}
          </p>
          <p className="mt-2 font-serif text-3xl text-ink nums">
            {formatMoney(outstanding, c)}
          </p>
          <p className="mt-2 text-sm text-sage">
            Still outstanding after zakat recorded in {window.label.toLowerCase()}.
          </p>
          <CycleActions
            currency={c}
            outstanding={outstanding}
            phase="payable"
            latestSnapshotId={latestSnapshotId}
            frozenThisCycle={frozenThisCycle}
          />
        </section>
      )}

      <section className="panel">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-xl text-ink">Ledger hawl</h2>
          <Link href="/settings" className="text-sm text-pine hover:underline">
            {hawl ? "Adjust start" : "Set start date"}
          </Link>
        </div>
        {hawl ? (
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-sage">
                Started {formatHijri(hawl.startDate, calendar)}
              </span>
              <span className="font-medium text-ink">
                {hawl.isComplete
                  ? "Complete"
                  : `${hawl.remainingDays} days remaining`}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden bg-mist">
              <div
                className="h-full bg-pine transition-all duration-700"
                style={{ width: `${Math.round(hawl.progress * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-sage">
              Due on {formatHijri(hawl.dueDate, calendar)} (
              {hawl.dueDate.toISOString().slice(0, 10)}), if wealth stays at or
              above nisab. Follow local moon-sighting for the payment day.
            </p>
            <div className="mt-3">
              <HawlCalendarLink dueDate={hawl.dueDate.toISOString().slice(0, 10)} />
            </div>
            {!hawl.isComplete && (
              <HawlRestart
                madhhab={madhhab}
                hawlStart={isoDay(hawl.startDate)}
                today={isoDay(today)}
              />
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-sage">
            Set the date wealth first reached nisab. Mizan counts one lunar year
            from there for payable status across this ledger.
          </p>
        )}
      </section>

      {perAssetHawl.length > 0 && (
        <section className="panel">
          <h2 className="font-serif text-xl text-ink">Per-holding reminders</h2>
          <p className="mt-1 text-sm text-sage">
            Optional start dates on holdings — useful for new cash or recovered
            debts. Reminder only; payable zakat still uses the ledger hawl above.
          </p>
          <ul className="mt-4 divide-y divide-mist border-t border-mist">
            {perAssetHawl.map((a) => (
              <li key={a.id} className="ledger-row">
                <div>
                  <p className="text-ink">{a.label}</p>
                  <p className="text-xs text-sage">
                    Due {formatHijri(a.status.dueDate, calendar)}
                  </p>
                </div>
                <p className="text-sm text-ink">
                  {a.status.isComplete
                    ? "Complete"
                    : `${a.status.remainingDays}d left`}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/assets" className="mt-3 inline-block text-sm text-pine hover:underline">
            Edit on the ledger
          </Link>
        </section>
      )}

      <section className="panel">
        <h2 className="font-serif text-xl text-ink">This reckoning</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="ledger-row">
            <dt className="text-sage">Net zakatable</dt>
            <dd className="nums font-medium">{formatMoney(result.netZakatable, c)}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">Nisab ({settings.nisabStandard})</dt>
            <dd className="nums">{formatMoney(result.nisab, c)}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">
              {phase === "payable" ? "Zakat payable" : "Indicative zakat"} (
              {formatPercent(result.rate, result.basis === "solar" ? 3 : 1)})
            </dt>
            <dd className="nums font-medium text-pine">
              {result.isDue ? formatMoney(result.zakatDue, c) : "None"}
            </dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">Paid · {window.label}</dt>
            <dd className="nums">{formatMoney(zakatPaid, c)}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-ink">Outstanding</dt>
            <dd className="nums font-medium">{formatMoney(outstanding, c)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-sage">{window.detail}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/zakat" className="btn-ghost">
            Full breakdown
          </Link>
          <Link href="/statement" className="btn-ghost">
            Printable statement
          </Link>
        </div>
      </section>

      <SnapshotCompare freezes={recentFreezes.slice(0, 2)} />

      <section id="freeze-year" className="panel space-y-6">
        <ReckoningStepNav current="freeze" />
        <div>
          <h2 className="font-serif text-xl text-ink">Freeze a year</h2>
          <p className="mt-2 text-sm text-sage">
            Close path: pay → freeze → roll the ledger hawl → statement. When you
            pay, keep a frozen copy — and optionally a letter for next year.
          </p>
          {phase === "payable" ? (
            <CloseYearPath
              current={closeStep}
              currency={c}
              outstanding={outstanding}
              latestSnapshotId={latestSnapshotId}
            />
          ) : null}
          <div className="mt-4">
            <FreezeYearButton
              defaultLabel={freezeLabel}
              emphasize={cycleMet}
            />
          </div>
        </div>

        {snaps.length > 0 && (
          <ul className="mt-8 divide-y divide-mist border-t border-mist">
            {snaps.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/year/snapshots/${s.id}`}
                  className="ledger-row hover:bg-mist/30"
                >
                  <div>
                    <p className="font-medium text-ink">{s.label}</p>
                    <p className="text-xs text-sage">{s.takenAt}</p>
                  </div>
                  <span className="text-sm text-pine">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
