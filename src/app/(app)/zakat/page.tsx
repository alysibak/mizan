import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { loadReckoning } from "@/lib/reckoning";
import { categoryMeta } from "@/lib/categories";
import { formatMoney, formatPercent } from "@/lib/money";
import EstimateBanner from "@/components/EstimateBanner";
import CycleActions from "@/components/CycleActions";
import { duePhaseLabel } from "@/lib/giving-window";

function Row({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "brass" | "danger" | "pine";
}) {
  return (
  <div className="flex items-baseline justify-between gap-4 py-2.5">
    <div>
      <p className="text-sm text-ink">{label}</p>
      {sub && <p className="text-xs text-sage">{sub}</p>}
    </div>
    <p
      className={
        "font-medium nums " +
        (accent === "brass"
          ? "text-brassDeep"
          : accent === "danger"
            ? "text-danger"
            : accent === "pine"
              ? "text-pine"
              : "text-ink")
      }
    >
      {value}
    </p>
  </div>
);
}

export default async function ZakatPage() {
  const user = (await getCurrentUser())!;
  const {
    settings,
    assets: assetRows,
    result: r,
    phase,
    hawl,
    outstanding,
    latestFreeze,
    frozenThisCycle,
  } = await loadReckoning(user.id);
  const c = settings.currency;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-ink">How your zakat is worked out</h1>
        <p className="mt-2 text-sm text-sage">
          The minimum (nisab) is set by {settings.nisabStandard}, and the year is
          counted by the {settings.calendarBasis === "solar" ? "solar" : "lunar"} calendar. You can change
          both in{" "}
          <Link href="/settings#how-counted" className="text-pine hover:underline">
            Settings
          </Link>
          .
        </p>
      </header>

      {assetRows.length === 0 ? (
        <div className="card border-dashed p-6 text-center">
          <p className="text-sm text-sage">Add what you own first, and the working shows here.</p>
          <Link href="/assets" className="btn-primary mt-3">
            Add what I own
          </Link>
        </div>
      ) : (
        <>
          {/* Asset lines */}
          <section className="card p-5">
            <h2 className="font-serif text-lg text-ink">1. What counts for zakat</h2>
            <div className="mt-2 divide-y divide-mist">
              {r.lines.map((line, i) => (
                <Row
                  key={i}
                  label={line.label}
                  sub={
                    categoryMeta(line.category).label +
                    (line.zakatablePortion < 1
                      ? ` · ${formatPercent(line.zakatablePortion, 0)} of ${formatMoney(line.amount, c)}`
                      : "")
                  }
                  value={formatMoney(line.zakatableAmount, c)}
                />
              ))}
            </div>
            <div className="mt-2 border-t border-ink/10 pt-2">
              <Row label="All that counts" value={formatMoney(r.grossZakatable, c)} />
            </div>
          </section>

          {/* Deductions and net */}
          <section className="card p-5">
            <h2 className="font-serif text-lg text-ink">2. Take off debts you owe</h2>
            {r.deductibleLiabilities > 0 ? (
              <div className="mt-2 divide-y divide-mist">
                <Row
                  label="Debts taken off"
                  value={"−" + formatMoney(r.deductibleLiabilities, c)}
                  accent="danger"
                />
                <Row
                  label="What counts, after debts"
                  value={formatMoney(r.netZakatable, c)}
                />
              </div>
            ) : (
              // Nothing to take off: no line of zeros.
              <p className="mt-2 text-base text-sage">
                None added, so nothing is taken off.{" "}
                <Link href="/assets#debts" className="text-pine underline underline-offset-2">
                  Add a debt
                </Link>
              </p>
            )}
          </section>

          {/* Nisab comparison */}
          <section className="card p-5">
            <h2 className="font-serif text-lg text-ink">3. Is it more than the minimum (nisab)?</h2>
            <div className="mt-2 divide-y divide-mist">
              <Row
                label="Minimum by gold (85 g)"
                value={formatMoney(r.goldNisab, c)}
                accent={settings.nisabStandard === "gold" ? "brass" : undefined}
                sub={settings.nisabStandard === "gold" ? "The one you use" : undefined}
              />
              <Row
                label="Minimum by silver (595 g)"
                value={formatMoney(r.silverNisab, c)}
                accent={settings.nisabStandard === "silver" ? "brass" : undefined}
                sub={settings.nisabStandard === "silver" ? "The one you use" : undefined}
              />
            </div>
          </section>

          {/* Result */}
          <section
            className={
              "card border-2 p-6 " +
              (r.isDue ? "border-pine/40" : "border-mist")
            }
          >
            {r.isDue ? (
              <>
                <p className="eyebrow text-pine">
                  {phase === "payable" ? "4. Zakat due" : "4. Your zakat, so far"}
                </p>
                <p className="mt-1 font-serif text-4xl text-pine nums">
                  {formatMoney(r.zakatDue, c)}
                </p>
                <p className="mt-2 text-sm text-sage">
                  {formatMoney(r.netZakatable, c)} ×{" "}
                  {formatPercent(r.rate, r.basis === "solar" ? 3 : 1)} (
                  {r.basis === "solar" ? "solar" : "lunar"} year).{" "}
                  {duePhaseLabel(phase, Boolean(settings.hawlStartDate))}.
                  {phase === "indicative" && hawl
                    ? ` Your zakat day is ${hawl.remainingDays} days away.`
                    : ""}
                  {phase === "payable" && outstanding > 0
                    ? ` ${formatMoney(outstanding, c)} still to give this year.`
                    : ""}
                </p>
                <CycleActions
                  currency={c}
                  outstanding={outstanding}
                  phase={phase}
                  latestSnapshotId={latestFreeze?.id ?? null}
                  frozenThisCycle={frozenThisCycle}
                />
              </>
            ) : (
              <>
                <p className="eyebrow text-sage">No zakat due</p>
                <p className="mt-1 font-serif text-2xl text-ink">
                  Below the minimum (nisab)
                </p>
                <p className="mt-2 text-sm text-sage">
                  What counts is{" "}
                  {formatMoney(Math.abs(r.marginToNisab), c)} short of the
                  minimum by {settings.nisabStandard}.
                </p>
              </>
            )}
          </section>

          <p className="text-xs leading-relaxed text-sage">
            This is an estimate to help you plan. Rulings differ on long-term
            investments, retirement funds, and debt.{" "}
            <Link href="/method" className="text-pine hover:underline">
              How it works
            </Link>
            . For your specific situation, consult a qualified scholar.
          </p>
        </>
      )}
      <EstimateBanner />
    </div>
  );
}
