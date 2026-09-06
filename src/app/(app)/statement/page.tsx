import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, liabilities, givingRecords } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { calculateZakat } from "@/lib/zakat";
import { categoryMeta } from "@/lib/categories";
import { hawlStatus, formatHijri, gregorianToHijri } from "@/lib/hijri";
import { formatMoney, formatPercent } from "@/lib/money";
import { MADHHAB_LABELS, parseMadhhab } from "@/lib/madhhab";
import {
  duePhase,
  duePhaseLabel,
  paymentWindow,
  sumZakatInWindow,
  dateInWindow,
} from "@/lib/giving-window";
import PrintButton from "@/components/PrintButton";
import EstimateBanner from "@/components/EstimateBanner";
import CycleActions from "@/components/CycleActions";
import { ASNAF, asnafLabel } from "@/lib/asnaf";

export default async function StatementPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  const hijriYear = gregorianToHijri(new Date()).year;
  const madhhab = parseMadhhab(settings.madhhab);

  const [assetRows, liabilityRows, givingRows] = await Promise.all([
    db.select().from(assets).where(eq(assets.userId, user.id)),
    db.select().from(liabilities).where(eq(liabilities.userId, user.id)),
    db
      .select()
      .from(givingRecords)
      .where(eq(givingRecords.userId, user.id))
      .orderBy(desc(givingRecords.date)),
  ]);

  const r = calculateZakat({
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
  const sadaqahPaid = givingRows
    .filter((g) => g.type === "sadaqah" && dateInWindow(g.date, window))
    .reduce((t, g) => t + g.amount, 0);
  const purificationPaid = givingRows
    .filter((g) => g.type === "purification" && dateInWindow(g.date, window))
    .reduce((t, g) => t + g.amount, 0);
  const yearGiving = givingRows.filter((g) => dateInWindow(g.date, window));
  const outstanding = Math.max(0, r.zakatDue - zakatPaid);
  const hawl = settings.hawlStartDate ? hawlStatus(settings.hawlStartDate) : null;
  const phase = duePhase({
    meetsNisab: r.isDue,
    hawlStartDate: settings.hawlStartDate,
  });
  const c = settings.currency;
  const printed = new Date().toISOString().slice(0, 10);
  const title =
    window.kind === "hawl"
      ? `Hawl ${window.start} → ${window.end}`
      : `${window.start.slice(0, 4)} · ${hijriYear} AH`;

  const asnafTotals = ASNAF.map((a) => ({
    key: a.key,
    label: a.label,
    amount: yearGiving
      .filter((g) => g.type === "zakat" && g.asnaf === a.key)
      .reduce((t, g) => t + g.amount, 0),
  })).filter((a) => a.amount > 0);

  return (
    <div className="document-print space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-serif text-2xl text-ink print:text-3xl">Mizan</p>
          <p className="label mt-3 text-brass">Zakat statement</p>
          <h1 className="mt-1 font-serif text-3xl text-ink">{title}</h1>
          <p className="mt-2 text-sm text-sage">
            Prepared for {user.name} · {printed} · {MADHHAB_LABELS[madhhab]}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <PrintButton />
          <Link href="/zakat" className="btn-ghost">
            Full breakdown
          </Link>
        </div>
      </header>

      <div className="print:hidden">
        <EstimateBanner />
      </div>

      {hawl?.isComplete && r.isDue && outstanding > 0 && (
        <div className="card border-pine/40 bg-pine/5 p-5">
          <p className="font-serif text-xl text-ink">Hawl is complete.</p>
          <p className="mt-1 text-sm text-sage">
            {formatMoney(outstanding, c)} remains for this cycle after what you
            have already recorded.
          </p>
          <Link
            href={`/giving?type=zakat&amount=${outstanding}`}
            className="btn-primary mt-4 print:hidden"
          >
            Record a zakat payment
          </Link>
        </div>
      )}

      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">How this was reckoned</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-sage">School profile</dt>
            <dd className="text-ink">{MADHHAB_LABELS[madhhab]}</dd>
          </div>
          <div>
            <dt className="text-sage">Nisab standard</dt>
            <dd className="text-ink">{settings.nisabStandard}</dd>
          </div>
          <div>
            <dt className="text-sage">Calendar</dt>
            <dd className="text-ink">
              {settings.calendarBasis} ({formatPercent(r.rate, r.basis === "solar" ? 3 : 1)})
            </dd>
          </div>
          <div>
            <dt className="text-sage">Gold / silver (per gram)</dt>
            <dd className="nums text-ink">
              {formatMoney(settings.goldPricePerGram, c)} /{" "}
              {formatMoney(settings.silverPricePerGram, c)}
            </dd>
          </div>
          <div>
            <dt className="text-sage">Hawl</dt>
            <dd className="text-ink">
              {hawl
                ? `${formatHijri(hawl.startDate)} → ${formatHijri(hawl.dueDate)}${
                    hawl.isComplete ? " · complete" : ` · ${hawl.remainingDays} days left`
                  }`
                : "Not set"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card overflow-hidden p-0">
        <h2 className="border-b border-mist px-5 py-4 font-serif text-lg text-ink">
          Zakatable assets
        </h2>
        {r.lines.length === 0 ? (
          <p className="px-5 py-6 text-sm text-sage">No assets recorded.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-mist text-xs uppercase tracking-wide text-sage">
              <tr>
                <th className="px-5 py-2 font-medium">Holding</th>
                <th className="px-5 py-2 font-medium">Value</th>
                <th className="px-5 py-2 font-medium">Counted</th>
              </tr>
            </thead>
            <tbody>
              {r.lines.map((line, i) => (
                <tr key={i} className="border-b border-mist/70">
                  <td className="px-5 py-2">
                    <p className="text-ink">{line.label}</p>
                    <p className="text-xs text-sage">{categoryMeta(line.category).label}</p>
                  </td>
                  <td className="px-5 py-2 nums">{formatMoney(line.amount, c)}</td>
                  <td className="px-5 py-2 nums">{formatMoney(line.zakatableAmount, c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {liabilityRows.length > 0 && (
        <section className="card overflow-hidden p-0">
          <h2 className="border-b border-mist px-5 py-4 font-serif text-lg text-ink">
            Debts
          </h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-mist text-xs uppercase tracking-wide text-sage">
              <tr>
                <th className="px-5 py-2 font-medium">Description</th>
                <th className="px-5 py-2 font-medium">Amount</th>
                <th className="px-5 py-2 font-medium">Counted</th>
              </tr>
            </thead>
            <tbody>
              {liabilityRows.map((l) => (
                <tr key={l.id} className="border-b border-mist/70">
                  <td className="px-5 py-2 text-ink">{l.label}</td>
                  <td className="px-5 py-2 nums">{formatMoney(l.amount, c)}</td>
                  <td className="px-5 py-2 text-sage">
                    {l.deductible ? "Deducted from zakatable wealth" : "Not deducted"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">The sum</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-sage">Gross zakatable</dt>
            <dd className="nums">{formatMoney(r.grossZakatable, c)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-sage">Deductible liabilities</dt>
            <dd className="nums text-danger">
              −{formatMoney(r.deductibleLiabilities, c)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-sage">Net zakatable</dt>
            <dd className="nums font-medium">{formatMoney(r.netZakatable, c)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-sage">
              Nisab ({settings.nisabStandard})
            </dt>
            <dd className="nums">{formatMoney(r.nisab, c)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-mist pt-2">
            <dt className="text-ink">
              {phase === "payable" ? "Zakat payable" : "Indicative zakat"}
            </dt>
            <dd className="font-serif text-xl nums text-pine">
              {r.isDue ? formatMoney(r.zakatDue, c) : "None — below nisab"}
            </dd>
          </div>
          <p className="text-xs text-sage">
            {duePhaseLabel(phase, Boolean(settings.hawlStartDate))}
          </p>
          <div className="flex justify-between gap-4">
            <dt className="text-sage">Zakat · {window.label}</dt>
            <dd className="nums">{formatMoney(zakatPaid, c)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-sage">Still outstanding</dt>
            <dd className="nums font-medium">{formatMoney(outstanding, c)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-sage">Sadaqah · {window.label}</dt>
            <dd className="nums">{formatMoney(sadaqahPaid, c)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-sage">Purification · {window.label}</dt>
            <dd className="nums">{formatMoney(purificationPaid, c)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-sage">
          {window.detail} Purification of interest is not subtracted from zakat.
        </p>
        <div className="mt-4 print:hidden">
          <CycleActions
            currency={c}
            outstanding={outstanding}
            phase={phase}
          />
        </div>
      </section>

      {asnafTotals.length > 0 && (
        <section className="card p-5">
          <h2 className="font-serif text-lg text-ink">Zakat by asnaf</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {asnafTotals.map((a) => (
              <div key={a.key} className="flex justify-between gap-4">
                <dt className="text-sage">{a.label}</dt>
                <dd className="nums">{formatMoney(a.amount, c)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {yearGiving.length > 0 && (
        <section className="card overflow-hidden p-0">
          <h2 className="border-b border-mist px-5 py-4 font-serif text-lg text-ink">
            Giving · {window.label}
          </h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-mist text-xs uppercase tracking-wide text-sage">
              <tr>
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-5 py-2 font-medium">Kind</th>
                <th className="px-5 py-2 font-medium">To</th>
                <th className="px-5 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {yearGiving.map((g) => (
                <tr key={g.id} className="border-b border-mist/70">
                  <td className="px-5 py-2 nums text-sage">{g.date}</td>
                  <td className="px-5 py-2 text-ink">
                    {g.type === "zakat"
                      ? g.asnaf
                        ? `Zakat · ${asnafLabel(g.asnaf)}`
                        : "Zakat"
                      : g.type === "purification"
                        ? "Purification"
                        : "Sadaqah"}
                  </td>
                  <td className="px-5 py-2 text-sage">{g.recipient || g.note || "—"}</td>
                  <td className="px-5 py-2 nums">{formatMoney(g.amount, c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="text-xs leading-relaxed text-sage">
        This statement is a personal estimate from figures you entered. It is not
        a fatwa. Scholars differ on long-term equities, pensions, jewellery, and
        debt.{" "}
        <Link href="/trust" className="text-pine hover:underline print:hidden">
          What is verified
        </Link>
        . For anything consequential, consult a qualified person of knowledge.
      </p>
    </div>
  );
}
