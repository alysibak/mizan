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
      ? `Zakat year from ${window.cycleStart}`
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
        <p className="label text-brassDeep">Zakat</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">This year’s zakat</h1>
        <p className="mt-2 max-w-xl text-base text-sage">
          How much, what you have given, and when it is due. When you have
          given it all, close the year.
        </p>
        {madhhab !== "general" ? (
          <p className="mt-1 text-xs text-sage">Counted the {MADHHAB_LABELS[madhhab]} way.</p>
        ) : null}
      </header>

      {rolled && isIsoDay(rolled) && hawl && isoDay(hawl.startDate) === rolled ? (
        <section className="border border-pine/40 bg-pine/5 px-5 py-5" role="status">
          <p className="label text-pine">A new year</p>
          <p className="mt-1 font-serif text-xl text-ink">Your next zakat year starts {rolled}.</p>
          <p className="mt-1 text-sm text-sage">
            Last year’s copy is kept below, under “Years you kept”. Open it to
            print it.
          </p>
        </section>
      ) : null}

      <EstimateBanner />

      {cycleMet && (
        <section className="border border-pine bg-pine/5 px-5 py-6">
          <p className="label text-pine">All given</p>
          <p className="mt-2 font-serif text-2xl text-ink">
            You have given all of this year’s zakat.
          </p>
          <p className="mt-2 text-sm text-sage">
            Close the year: Mizan keeps a copy and starts counting the next one.
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
            {dueNow ? "Your zakat day has come" : "A reminder date on something you own has come"}
          </p>
          <p className="mt-2 font-serif text-3xl text-ink nums">
            {formatMoney(outstanding, c)}
          </p>
          <p className="mt-2 text-sm text-sage">
            Still to give, after the zakat you noted {window.label.toLowerCase()}.
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
          <h2 className="font-serif text-xl text-ink">Your zakat day</h2>
          <Link href="/settings#zakat-day" className="text-sm text-pine hover:underline">
            {hawl ? "Change it" : "Set it"}
          </Link>
        </div>
        {hawl ? (
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-sage">
                {formatHijri(hawl.dueDate, calendar)}
              </span>
              <span className="font-medium text-ink">
                {hawl.isComplete
                  ? "It has come"
                  : `${hawl.remainingDays} ${hawl.remainingDays === 1 ? "day" : "days"} left`}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden bg-mist">
              <div
                className="h-full bg-pine transition-all duration-700"
                style={{ width: `${Math.round(hawl.progress * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-sage">
              Your zakat year began {formatHijri(hawl.startDate, calendar)}. It is
              due on {hawl.dueDate.toISOString().slice(0, 10)}, if you still have
              more than the minimum (nisab) then. The moon where you live may
              move it by a day.
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
            Not set yet. It is one lunar year after the day you first had the
            minimum (nisab). Not sure of that day? Pick one you will remember,
            such as 1 Ramadan, and keep to it every year.
          </p>
        )}
      </section>

      {perAssetHawl.length > 0 && (
        <section className="panel">
          <h2 className="font-serif text-xl text-ink">Reminder dates</h2>
          <p className="mt-1 text-sm text-sage">
            Dates you put on some of the things you own. They are reminders only:
            your zakat is still worked out on your zakat day.
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
                    ? "Come"
                    : `${a.status.remainingDays} days left`}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/assets" className="mt-3 inline-block text-sm text-pine hover:underline">
            Change them on “What I own”
          </Link>
        </section>
      )}

      <section className="panel">
        <h2 className="font-serif text-xl text-ink">This year’s figures</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="ledger-row">
            <dt className="text-sage">What counts, after debts</dt>
            <dd className="nums font-medium">{formatMoney(result.netZakatable, c)}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">The minimum (nisab, by {settings.nisabStandard})</dt>
            <dd className="nums">{formatMoney(result.nisab, c)}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">
              {phase === "payable" ? "Zakat due" : "Zakat, so far"} (
              {formatPercent(result.rate, result.basis === "solar" ? 3 : 1)})
            </dt>
            <dd className="nums font-medium text-pine">
              {result.isDue ? formatMoney(result.zakatDue, c) : "None"}
            </dd>
          </div>
          <div className="ledger-row">
            <dt className="text-sage">Given · {window.label}</dt>
            <dd className="nums">{formatMoney(zakatPaid, c)}</dd>
          </div>
          <div className="ledger-row">
            <dt className="text-ink">{phase === "payable" ? "Still to give" : "Not given yet"}</dt>
            <dd className="nums font-medium">{formatMoney(outstanding, c)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-sage">{window.detail}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/zakat" className="btn-ghost">
            How it is worked out
          </Link>
          <Link href="/statement" className="btn-ghost">
            Print this year
          </Link>
        </div>
      </section>

      <SnapshotCompare freezes={recentFreezes.slice(0, 2)} />

      <section id="freeze-year" className="panel space-y-6">
        <div>
          <h2 className="font-serif text-xl text-ink">Close the year</h2>
          <p className="mt-2 text-sm text-sage">
            Once you have given your zakat, close the year: Mizan keeps a copy
            of this year’s figures and starts counting the next. You can add a
            note to read next year.{" "}
            <Link href="/tools/reckoning-night" className="text-pine hover:underline">
              Do it step by step
            </Link>
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
              nextStart={hawl?.isComplete && !frozenThisCycle ? isoDay(hawl.dueDate) : null}
            />
          </div>
        </div>

        {snaps.length > 0 && (
          <div className="mt-8">
          <h3 className="font-serif text-lg text-ink">Years you kept</h3>
          <ul className="mt-2 divide-y divide-mist border-t border-mist">
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
          </div>
        )}
      </section>
    </div>
  );
}
