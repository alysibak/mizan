import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, liabilities, givingRecords } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { calculateZakat } from "@/lib/zakat";
import { hawlStatus, formatHijri } from "@/lib/hijri";
import { formatMoney, formatPercent } from "@/lib/money";
import Scale from "@/components/Scale";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);

  const [assetRows, liabilityRows, givingRows] = await Promise.all([
    db.select().from(assets).where(eq(assets.userId, user.id)),
    db.select().from(liabilities).where(eq(liabilities.userId, user.id)),
    db
      .select()
      .from(givingRecords)
      .where(eq(givingRecords.userId, user.id))
      .orderBy(desc(givingRecords.date)),
  ]);

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

  const currentYear = new Date().getFullYear();
  const zakatPaidThisYear = givingRows
    .filter((g) => g.type === "zakat" && g.date.startsWith(String(currentYear)))
    .reduce((t, g) => t + g.amount, 0);
  const zakatOutstanding = Math.max(0, result.zakatDue - zakatPaidThisYear);

  const hawl = settings.hawlStartDate
    ? hawlStatus(settings.hawlStartDate)
    : null;

  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brass">Your balance</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">
          As-salamu alaykum, {user.name.split(" ")[0]}
        </h1>
      </header>

      <Scale
        net={result.netZakatable}
        nisab={result.nisab}
        currency={settings.currency}
        standardLabel={settings.nisabStandard}
      />

      {/* Key figures */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="label">Zakat due now</p>
          <p className="mt-1 font-serif text-2xl text-pine nums">
            {result.isDue ? formatMoney(result.zakatDue, settings.currency) : "—"}
          </p>
          <p className="mt-1 text-xs text-sage">
            {result.isDue
              ? `At ${formatPercent(result.rate, result.basis === "solar" ? 3 : 1)} (${result.basis})`
              : "Below nisab"}
          </p>
        </div>
        <div className="card p-4">
          <p className="label">Zakat paid this year</p>
          <p className="mt-1 font-serif text-2xl text-ink nums">
            {formatMoney(zakatPaidThisYear, settings.currency)}
          </p>
          <p className="mt-1 text-xs text-sage">
            {zakatOutstanding > 0
              ? `${formatMoney(zakatOutstanding, settings.currency)} outstanding`
              : result.isDue
                ? "Fully met"
                : "Nothing due"}
          </p>
        </div>
        <div className="card p-4">
          <p className="label">Margin to nisab</p>
          <p
            className={
              "mt-1 font-serif text-2xl nums " +
              (result.marginToNisab >= 0 ? "text-gain" : "text-sage")
            }
          >
            {result.marginToNisab >= 0 ? "+" : ""}
            {formatMoney(result.marginToNisab, settings.currency)}
          </p>
          <p className="mt-1 text-xs text-sage">
            Against the {settings.nisabStandard} standard
          </p>
        </div>
      </div>

      {/* Hawl */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">Hawl, the holding year</h2>
          <Link href="/settings" className="text-sm text-pine hover:underline">
            {hawl ? "Adjust" : "Set start date"}
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
                  : `${hawl.remainingDays} days remaining`}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full bg-pine transition-all"
                style={{ width: `${Math.round(hawl.progress * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-sage">
              Zakat is due on {formatHijri(hawl.dueDate)} (
              {hawl.dueDate.toISOString().slice(0, 10)}), if your wealth stays at
              or above nisab.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-sage">
            Set the date your wealth first reached nisab, and Mizan will count the
            lunar year for you.
          </p>
        )}
      </section>

      {assetRows.length === 0 && (
        <div className="card border-dashed p-6 text-center">
          <p className="text-sm text-sage">
            You have not added any assets yet.
          </p>
          <Link href="/assets" className="btn-primary mt-3">
            Add your first asset
          </Link>
        </div>
      )}
    </div>
  );
}
