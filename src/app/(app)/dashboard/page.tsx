import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, liabilities, givingRecords, yearSnapshots } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { calculateZakat } from "@/lib/zakat";
import { hawlStatus, formatHijri } from "@/lib/hijri";
import { formatMoney, formatPercent } from "@/lib/money";
import {
  duePhase,
  duePhaseLabel,
  metalsFreshness,
  paymentWindow,
  sumZakatInWindow,
  dateInWindow,
} from "@/lib/giving-window";
import { parseSnapshotPayload } from "@/lib/snapshot";
import Scale from "@/components/Scale";
import EstimateBanner from "@/components/EstimateBanner";
import DashboardNotices from "@/components/DashboardNotices";
import HawlCalendarLink from "@/components/HawlCalendarLink";
import CycleActions from "@/components/CycleActions";
import LastLetterCard from "@/components/LastLetterCard";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);

  const [assetRows, liabilityRows, givingRows, latestSnap] = await Promise.all([
    db.select().from(assets).where(eq(assets.userId, user.id)),
    db.select().from(liabilities).where(eq(liabilities.userId, user.id)),
    db
      .select()
      .from(givingRecords)
      .where(eq(givingRecords.userId, user.id))
      .orderBy(desc(givingRecords.date)),
    db
      .select()
      .from(yearSnapshots)
      .where(eq(yearSnapshots.userId, user.id))
      .orderBy(desc(yearSnapshots.takenAt))
      .limit(1),
  ]);

  const lastLetter = (() => {
    const row = latestSnap[0];
    if (!row) return null;
    const payload = parseSnapshotPayload(row.payload);
    if (!payload?.letterToNextYear) return null;
    return {
      id: row.id,
      takenAt: row.takenAt,
      letter: payload.letterToNextYear,
    };
  })();

  const result = calculateZakat({
    assets: assetRows.map((a) => ({
      category: a.category,
      label: a.label,
      amount: a.amount,
      zakatablePortion: a.zakatablePortion,
    })),
    liabilities: liabilityRows.map((l) => ({
      label: l.label,
      amount: l.amount,
      deductible: l.deductible,
    })),
    prices: {
      goldPricePerGram: settings.goldPricePerGram,
      silverPricePerGram: settings.silverPricePerGram,
    },
    standard: settings.nisabStandard as "gold" | "silver",
    basis: settings.calendarBasis as "lunar" | "solar",
  });

  const window = paymentWindow(settings.hawlStartDate);
  const zakatPaid = sumZakatInWindow(givingRows, window);
  const zakatOutstanding = Math.max(0, result.zakatDue - zakatPaid);
  const hawl = settings.hawlStartDate ? hawlStatus(settings.hawlStartDate) : null;
  const phase = duePhase({
    meetsNisab: result.isDue,
    hawlStartDate: settings.hawlStartDate,
  });
  const dueNow = phase === "payable" && zakatOutstanding > 0;
  const metals = metalsFreshness({
    gold: settings.goldPricePerGram,
    silver: settings.silverPricePerGram,
    metalsUpdatedAt: settings.metalsUpdatedAt,
  });
  const metalsStale = metals.stale;
  const latestSnapshotId = latestSnap[0]?.id ?? null;
  const frozenThisCycle = Boolean(
    latestSnap[0] && dateInWindow(latestSnap[0].takenAt, window),
  );

  const checklist = [
    {
      done: Boolean(settings.hawlStartDate),
      label: "Set your ledger hawl start",
      href: "/settings",
    },
    {
      done: assetRows.length > 0,
      label: "Add at least one holding",
      href: "/assets",
    },
    {
      done: !metalsStale,
      label:
        metals.reason === "aged"
          ? "Reconfirm metal prices"
          : "Replace starter metal prices",
      href: "/settings",
    },
    {
      done: settings.madhhab !== "general",
      label: "Pick a school profile (optional)",
      href: "/settings",
    },
  ];

  return (
    <div className="space-y-10">
      <header>
        <p className="label text-brass">Balance</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">
          {user.name.split(" ")[0]}
        </h1>
      </header>

      <DashboardNotices
        items={checklist}
        metalsStale={metalsStale}
        metalsReason={metals.reason}
        metalsAgeDays={metals.ageDays}
      />

      {lastLetter ? (
        <LastLetterCard
          snapshotId={lastLetter.id}
          takenAt={lastLetter.takenAt}
          letter={lastLetter.letter}
        />
      ) : null}

      <EstimateBanner />

      {assetRows.length > 0 && (
        <section className="border border-mist px-5 py-5">
          <p className="label text-brass">Close the year</p>
          <p className="mt-1 font-serif text-xl text-ink">Reckoning night</p>
          <p className="mt-1 text-sm text-sage">
            Remember forgotten wealth, watch nisab, sketch envelopes, then pay →
            freeze → roll hawl → statement.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/tools/reckoning-night" className="btn-primary">
              Open the sitting
            </Link>
            {phase === "payable" ? (
              <Link href="/year#freeze-year" className="btn-ghost">
                Jump to close path
              </Link>
            ) : null}
          </div>
        </section>
      )}

      {dueNow && (
        <section className="border border-pine bg-pine/5 px-5 py-5">
          <p className="label text-pine">Payable now</p>
          <p className="mt-1 font-serif text-2xl text-ink nums">
            {formatMoney(zakatOutstanding, settings.currency)}
          </p>
          <p className="mt-1 text-sm text-sage">
            Ledger hawl is complete and wealth is at or above nisab.
          </p>
          <CycleActions
            currency={settings.currency}
            outstanding={zakatOutstanding}
            phase={phase}
            latestSnapshotId={latestSnapshotId}
            frozenThisCycle={frozenThisCycle}
          />
        </section>
      )}

      {phase === "payable" && zakatOutstanding === 0 && result.isDue && (
        <section className="border border-pine/40 bg-pine/5 px-5 py-5">
          <p className="label text-pine">Cycle met</p>
          <p className="mt-1 text-sm text-sage">
            Zakat for this cycle is recorded. Freeze, roll hawl, then print.
          </p>
          <CycleActions
            currency={settings.currency}
            outstanding={0}
            phase="payable"
            latestSnapshotId={latestSnapshotId}
            frozenThisCycle={frozenThisCycle}
          />
        </section>
      )}

      <Scale
        net={result.netZakatable}
        nisab={result.nisab}
        currency={settings.currency}
        standardLabel={settings.nisabStandard}
        variant="panel"
      />

      <dl className="grid gap-6 sm:grid-cols-3">
        <div>
          <dt className="label">
            {phase === "payable" ? "Zakat payable" : "Indicative zakat"}
          </dt>
          <dd className="mt-1 font-serif text-2xl text-pine nums">
            {result.isDue
              ? formatMoney(result.zakatDue, settings.currency)
              : "—"}
          </dd>
          <p className="mt-1 text-xs text-sage">
            {result.isDue
              ? `${duePhaseLabel(phase, Boolean(settings.hawlStartDate))} · ${formatPercent(result.rate, result.basis === "solar" ? 3 : 1)} (${result.basis})`
              : "Below nisab"}
          </p>
        </div>
        <div>
          <dt className="label">Paid · {window.label}</dt>
          <dd className="mt-1 font-serif text-2xl text-ink nums">
            {formatMoney(zakatPaid, settings.currency)}
          </dd>
          <p className="mt-1 text-xs text-sage" title={window.detail}>
            {zakatOutstanding > 0 && result.isDue
              ? `${formatMoney(zakatOutstanding, settings.currency)} outstanding`
              : result.isDue
                ? phase === "payable"
                  ? "Obligation met for this cycle"
                  : "Paid toward this cycle (hawl still open)"
                : "Nothing due"}
          </p>
        </div>
        <div>
          <dt className="label">Margin to nisab</dt>
          <dd
            className={
              "mt-1 font-serif text-2xl nums " +
              (result.marginToNisab >= 0 ? "text-gain" : "text-sage")
            }
          >
            {result.marginToNisab >= 0 ? "+" : ""}
            {formatMoney(result.marginToNisab, settings.currency)}
          </dd>
          <p className="mt-1 text-xs text-sage">
            {settings.nisabStandard} standard
          </p>
        </div>
      </dl>

      <section className="panel">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">Hawl</h2>
          <Link href="/year" className="text-sm text-pine hover:underline">
            Open year
          </Link>
        </div>
        {hawl ? (
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-sage">
                Started {formatHijri(hawl.startDate)}
              </span>
              <span className="font-medium text-ink">
                {hawl.isComplete
                  ? "Complete"
                  : `${hawl.remainingDays} days left`}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden bg-mist">
              <div
                className="h-full bg-pine transition-all duration-700"
                style={{ width: `${Math.round(hawl.progress * 100)}%` }}
              />
            </div>
            <div className="mt-3">
              <HawlCalendarLink hawlStartDate={settings.hawlStartDate!} />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-sage">
            Set a start date in settings to count the lunar year. Until then,
            paid totals use the calendar year.
          </p>
        )}
      </section>

      {assetRows.length === 0 && (
        <div className="border border-dashed border-mist px-6 py-8 text-center">
          <p className="text-sm text-sage">No holdings yet.</p>
          <Link href="/assets" className="btn-primary mt-4">
            Open the ledger
          </Link>
        </div>
      )}
    </div>
  );
}
