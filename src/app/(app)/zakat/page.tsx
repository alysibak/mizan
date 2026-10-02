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
          ? "text-brass"
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
        <p className="label text-brass">The reckoning</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Your zakat breakdown</h1>
        <p className="mt-2 text-sm text-sage">
          Calculated on the {settings.nisabStandard} nisab and the{" "}
          {settings.calendarBasis} year. Change either in{" "}
          <Link href="/settings" className="text-pine hover:underline">
            settings
          </Link>
          .{" "}
          <Link href="/statement" className="text-pine hover:underline">
            Yearly statement
          </Link>
          .
        </p>
      </header>

      <EstimateBanner />

      {assetRows.length === 0 ? (
        <div className="card border-dashed p-6 text-center">
          <p className="text-sm text-sage">Add assets first to see your breakdown.</p>
          <Link href="/assets" className="btn-primary mt-3">
            Go to assets
          </Link>
        </div>
      ) : (
        <>
          {/* Asset lines */}
          <section className="card p-5">
            <h2 className="font-serif text-lg text-ink">Zakatable assets</h2>
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
              <Row label="Gross zakatable" value={formatMoney(r.grossZakatable, c)} />
            </div>
          </section>

          {/* Deductions and net */}
          <section className="card p-5">
            <h2 className="font-serif text-lg text-ink">Deductions and net</h2>
            <div className="mt-2 divide-y divide-mist">
              <Row
                label="Deductible liabilities"
                value={"-" + formatMoney(r.deductibleLiabilities, c)}
                accent="danger"
              />
              <Row
                label="Net zakatable wealth"
                value={formatMoney(r.netZakatable, c)}
              />
            </div>
          </section>

          {/* Nisab comparison */}
          <section className="card p-5">
            <h2 className="font-serif text-lg text-ink">Nisab</h2>
            <div className="mt-2 divide-y divide-mist">
              <Row
                label="Gold nisab (85g)"
                value={formatMoney(r.goldNisab, c)}
                accent={settings.nisabStandard === "gold" ? "brass" : undefined}
                sub={settings.nisabStandard === "gold" ? "Your chosen standard" : undefined}
              />
              <Row
                label="Silver nisab (595g)"
                value={formatMoney(r.silverNisab, c)}
                accent={settings.nisabStandard === "silver" ? "brass" : undefined}
                sub={settings.nisabStandard === "silver" ? "Your chosen standard" : undefined}
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
                <p className="label text-pine">
                  {phase === "payable" ? "Zakat payable" : "Indicative zakat"}
                </p>
                <p className="mt-1 font-serif text-4xl text-pine nums">
                  {formatMoney(r.zakatDue, c)}
                </p>
                <p className="mt-2 text-sm text-sage">
                  {formatMoney(r.netZakatable, c)} ×{" "}
                  {formatPercent(r.rate, r.basis === "solar" ? 3 : 1)} (
                  {r.basis} year).{" "}
                  {duePhaseLabel(phase, Boolean(settings.hawlStartDate))}.
                  {phase === "indicative" && hawl
                    ? ` About ${hawl.remainingDays} days of hawl remain.`
                    : ""}
                  {phase === "payable" && outstanding > 0
                    ? ` ${formatMoney(outstanding, c)} still outstanding this cycle.`
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
                <p className="label text-sage">No zakat due</p>
                <p className="mt-1 font-serif text-2xl text-ink">
                  Below the nisab threshold
                </p>
                <p className="mt-2 text-sm text-sage">
                  Your net zakatable wealth is{" "}
                  {formatMoney(Math.abs(r.marginToNisab), c)} under the{" "}
                  {settings.nisabStandard} nisab.
                </p>
              </>
            )}
          </section>

          <p className="text-xs leading-relaxed text-sage">
            This is an estimate to help you plan. Rulings differ on long-term
            investments, retirement funds, and debt.{" "}
            <Link href="/trust" className="text-pine hover:underline">
              What is verified
            </Link>
            . For your specific situation, consult a qualified scholar.
          </p>
        </>
      )}
    </div>
  );
}
