import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { isDemoUser } from "@/lib/demo";
import { loadReckoning } from "@/lib/reckoning";
import { formatHijri } from "@/lib/hijri";
import { formatMoney } from "@/lib/money";
import Scale from "@/components/Scale";
import EstimateBanner from "@/components/EstimateBanner";
import DashboardNotices from "@/components/DashboardNotices";
import HawlCalendarLink from "@/components/HawlCalendarLink";
import CycleActions from "@/components/CycleActions";
import LastLetterCard from "@/components/LastLetterCard";
import { emailEnabled } from "@/lib/email";
import { hasPassword } from "@/lib/api";
import { FromThisPhoneNotice } from "@/components/FromThisPhone";
import EverythingElse from "@/components/EverythingElse";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const user = (await getCurrentUser())!;
  const {
    settings,
    assets: assetRows,
    result,
    zakatPaid,
    outstanding: zakatOutstanding,
    phase,
    hawl,
    latestFreeze,
    frozenThisCycle,
    calendar,
    metals,
  } = await loadReckoning(user.id);

  const lastLetter = latestFreeze?.payload?.letterToNextYear
    ? {
        id: latestFreeze.id,
        takenAt: latestFreeze.takenAt,
        letter: latestFreeze.payload.letterToNextYear,
      }
    : null;

  const dueNow = phase === "payable" && zakatOutstanding > 0;
  const metalsStale = metals.stale;
  const latestSnapshotId = latestFreeze?.id ?? null;

  const checklist = [
    {
      done: Boolean(settings.hawlStartDate),
      label: "Set your zakat day",
      href: "/settings#zakat-day",
    },
    {
      done: assetRows.length > 0,
      label: "Add what you own",
      href: "/assets",
    },
    {
      done: !metalsStale,
      label:
        metals.reason === "aged"
          ? "Check gold and silver prices again"
          : "Check today’s gold and silver prices",
      href: "/settings#metal-prices",
    },
    {
      // Either is a way back in after a forgotten password; with Google,
      // Google is the way back in.
      done:
        !hasPassword(user) ||
        Boolean(user.recoveryCodeHash) ||
        (emailEnabled() && Boolean(user.emailVerifiedAt)),
      label: emailEnabled()
        ? "Confirm your email, or save a code in case you forget your password"
        : "Save a code in case you forget your password",
      href: "/settings#account",
    },
  ];

  const c = settings.currency;
  const dueDay = hawl ? formatHijri(hawl.dueDate, calendar) : null;
  // One plain sentence first: do I owe zakat, how much, and when.
  const answer =
    phase === "unverified" || assetRows.length === 0
      ? null
      : phase === "below_nisab"
        ? {
            title: "No zakat to pay right now.",
            body: `What counts for zakat, ${formatMoney(result.netZakatable, c)}, is below the minimum (nisab) of ${formatMoney(result.nisab, c)}.`,
          }
        : phase === "payable"
          ? null
          : {
              title: `Your zakat would be about ${formatMoney(result.zakatDue, c)}.`,
              body:
                (hawl
                  ? `Due on your zakat day, ${dueDay}: ${hawl.remainingDays} ${hawl.remainingDays === 1 ? "day" : "days"} from now.`
                  : "Due one lunar year after you first had the minimum (nisab). Set that day, and Mizan will tell you when.") +
                (zakatPaid > 0 ? ` You have given ${formatMoney(zakatPaid, c)} so far.` : ""),
            };

  return (
    <div className="space-y-10">
      <header>
        <p className="label text-brassDeep">Your zakat</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">
          {user.name.split(" ")[0]}
        </h1>
      </header>

      {/* The shared demo cannot be added to. */}
      {isDemoUser(user) ? null : <FromThisPhoneNotice />}

      {/* Just set up, the welcome card below says the same. */}
      {assetRows.length === 0 && welcome !== "1" && (
        <div className="border border-dashed border-mist px-6 py-8 text-center">
          <p className="text-base text-ink">Nothing added yet.</p>
          <p className="mt-1 text-sm text-sage">
            Add your savings, cash and gold, and Mizan works out your zakat.
          </p>
          <Link href="/assets" className="btn-primary mt-4">
            Add what I own
          </Link>
        </div>
      )}

      <DashboardNotices
        items={checklist}
        metalsStale={metalsStale}
        metalsReason={metals.reason}
        metalsAgeDays={metals.ageDays}
        welcome={welcome === "1"}
        part="top"
        currency={settings.currency}
      />

      {answer ? (
        <section className="border border-pine/40 bg-pine/5 px-5 py-5">
          <p className="font-serif text-2xl text-ink nums">{answer.title}</p>
          <p className="mt-2 text-base text-sage">{answer.body}</p>
          {!hawl && phase !== "below_nisab" ? (
            <Link href="/settings#zakat-day" className="btn-primary mt-4">
              Set my zakat day
            </Link>
          ) : null}
        </section>
      ) : null}

      {dueNow && (
        <section className="border border-pine bg-pine/5 px-5 py-5">
          <p className="label text-pine">Zakat to give now</p>
          <p className="mt-1 font-serif text-3xl text-ink nums">
            {formatMoney(zakatOutstanding, c)}
          </p>
          <p className="mt-1 text-base text-sage">
            Your zakat day has come, and you have more than the minimum (nisab).
          </p>
          <CycleActions
            currency={c}
            outstanding={zakatOutstanding}
            phase={phase}
            latestSnapshotId={latestSnapshotId}
            frozenThisCycle={frozenThisCycle}
          />
        </section>
      )}

      {phase === "payable" && zakatOutstanding === 0 && result.isDue && (
        <section className="border border-pine/40 bg-pine/5 px-5 py-5">
          <p className="label text-pine">All given</p>
          <p className="mt-1 font-serif text-xl text-ink">
            You have given all of this year’s zakat.
          </p>
          <p className="mt-1 text-sm text-sage">
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

      <Scale
        net={result.netZakatable}
        nisab={result.nisab}
        currency={c}
        standardLabel={settings.nisabStandard}
        variant="panel"
      />

      <section className="panel">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">Your zakat day</h2>
          <Link href={hawl ? "/year" : "/settings#zakat-day"} className="text-sm text-pine hover:underline">
            {hawl ? "See this year" : "Set it"}
          </Link>
        </div>
        {hawl ? (
          <div className="mt-4">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-sage">{dueDay}</span>
              <span className="font-medium text-ink">
                {hawl.isComplete
                  ? "It has come"
                  : `${hawl.remainingDays} ${hawl.remainingDays === 1 ? "day" : "days"} left`}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden bg-mist">
              <div
                className="h-full bg-pine transition-all duration-700"
                style={{ width: `${Math.round(hawl.progress * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-sage">
              Your zakat year began {formatHijri(hawl.startDate, calendar)}.
            </p>
            <div className="mt-3">
              <HawlCalendarLink dueDate={hawl.dueDate.toISOString().slice(0, 10)} />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-sage">Not set yet.</p>
        )}
      </section>

      <EverythingElse currency={c} />

      {/* The demo is read-only: a to-do list there could not be done. */}
      {isDemoUser(user) ? null : (
        <DashboardNotices
          items={checklist}
          welcome={welcome === "1"}
          part="bottom"
        />
      )}

      {lastLetter ? (
        <LastLetterCard
          snapshotId={lastLetter.id}
          takenAt={lastLetter.takenAt}
          letter={lastLetter.letter}
        />
      ) : null}

      {/* Only near the zakat day: until then it is one more thing to read. */}
      {assetRows.length > 0 && hawl && !dueNow && (hawl.isComplete || hawl.remainingDays <= 30) && (
        <section className="border border-mist px-5 py-5">
          <p className="label text-brassDeep">When your zakat day comes</p>
          <p className="mt-1 font-serif text-xl text-ink">Close the year, step by step</p>
          <p className="mt-1 text-sm text-sage">
            Check for anything you forgot, give your zakat, then close the
            year.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/tools/reckoning-night" className="btn-primary">
              Start
            </Link>
            {phase === "payable" ? (
              <Link href="/year#freeze-year" className="btn-ghost">
                Go to the last step
              </Link>
            ) : null}
          </div>
        </section>
      )}

      <EstimateBanner />
    </div>
  );
}
