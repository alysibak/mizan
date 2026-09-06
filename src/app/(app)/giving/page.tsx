import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, liabilities, givingRecords } from "@/db/schema";
import { getCurrentUser, getUserSettings } from "@/lib/session";
import { formatMoney } from "@/lib/money";
import { calculateZakat } from "@/lib/zakat";
import {
  duePhase,
  paymentWindow,
  sumZakatInWindow,
} from "@/lib/giving-window";
import GivingManager from "@/components/GivingManager";
import RoundUpTool from "@/components/RoundUpTool";
import { parseAsnaf } from "@/lib/asnaf";

const GIVING_TYPES = ["zakat", "sadaqah", "purification"] as const;
type GivingType = (typeof GIVING_TYPES)[number];

function parseType(value?: string): GivingType {
  return GIVING_TYPES.includes(value as GivingType)
    ? (value as GivingType)
    : "sadaqah";
}

function parseAmount(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default async function GivingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; amount?: string; asnaf?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const settings = await getUserSettings(user.id);
  const params = await searchParams;
  const defaultType = parseType(params.type);
  const defaultAmount = parseAmount(params.amount);
  const defaultAsnaf = parseAsnaf(params.asnaf);

  const [rows, assetRows, liabilityRows] = await Promise.all([
    db
      .select()
      .from(givingRecords)
      .where(eq(givingRecords.userId, user.id))
      .orderBy(desc(givingRecords.date)),
    db.select().from(assets).where(eq(assets.userId, user.id)),
    db.select().from(liabilities).where(eq(liabilities.userId, user.id)),
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

  const window = paymentWindow(settings.hawlStartDate);
  const zakatCycle = sumZakatInWindow(rows, window);
  const outstanding = Math.max(0, result.zakatDue - zakatCycle);
  const phase = duePhase({
    meetsNisab: result.isDue,
    hawlStartDate: settings.hawlStartDate,
  });

  const totalSadaqah = rows
    .filter((r) => r.type === "sadaqah")
    .reduce((t, r) => t + r.amount, 0);
  const totalZakat = rows
    .filter((r) => r.type === "zakat")
    .reduce((t, r) => t + r.amount, 0);
  const totalPurification = rows
    .filter((r) => r.type === "purification")
    .reduce((t, r) => t + r.amount, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brass">Sadaqah and zakat</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Your giving</h1>
        <p className="mt-2 text-sm text-sage">
          Keep a record of what you give. Only zakat entries in{" "}
          {window.label.toLowerCase()} count toward outstanding. Purification of
          interest is logged separately.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="label">Zakat · {window.label}</p>
          <p className="mt-1 font-serif text-2xl text-pine nums">
            {formatMoney(zakatCycle, settings.currency)}
          </p>
          <p className="mt-1 text-xs text-sage">
            {outstanding > 0 && result.isDue
              ? `${formatMoney(outstanding, settings.currency)} outstanding`
              : "Toward this cycle"}
          </p>
        </div>
        <div className="card p-4">
          <p className="label">All-time zakat</p>
          <p className="mt-1 font-serif text-2xl text-ink nums">
            {formatMoney(totalZakat, settings.currency)}
          </p>
        </div>
        <div className="card p-4">
          <p className="label">All-time sadaqah</p>
          <p className="mt-1 font-serif text-2xl text-brass nums">
            {formatMoney(totalSadaqah, settings.currency)}
          </p>
        </div>
        <div className="card p-4">
          <p className="label">Purification</p>
          <p className="mt-1 font-serif text-2xl text-sage nums">
            {formatMoney(totalPurification, settings.currency)}
          </p>
          <p className="mt-1 text-xs text-sage">Not counted as zakat</p>
        </div>
      </div>

      <RoundUpTool currency={settings.currency} />

      <GivingManager
        key={`${defaultType}-${defaultAmount ?? ""}-${defaultAsnaf ?? ""}`}
        records={rows}
        currency={settings.currency}
        defaultType={defaultType}
        defaultAmount={defaultAmount}
        defaultAsnaf={defaultAsnaf}
        cycleOutstanding={outstanding}
        cyclePayable={phase === "payable"}
      />
    </div>
  );
}
