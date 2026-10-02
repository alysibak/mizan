import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { loadReckoning } from "@/lib/reckoning";
import { formatMoney, toCents } from "@/lib/money";
import { parseGivingType } from "@/lib/giving";
import GivingManager from "@/components/GivingManager";
import RoundUpTool from "@/components/RoundUpTool";
import { parseAsnaf } from "@/lib/asnaf";

function parseAmount(value?: string): number | undefined {
  if (!value) return undefined;
  const n = toCents(Number(value));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default async function GivingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; amount?: string; asnaf?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const params = await searchParams;
  const defaultType = parseGivingType(params.type) ?? "sadaqah";
  const defaultAmount = parseAmount(params.amount);
  const defaultAsnaf = parseAsnaf(params.asnaf);

  const {
    settings,
    giving: rows,
    result,
    window,
    zakatPaid: zakatCycle,
    outstanding,
    phase,
  } = await loadReckoning(user.id);

  const totalOf = (type: string) =>
    rows.filter((r) => r.type === type).reduce((t, r) => t + r.amount, 0);
  const totalSadaqah = totalOf("sadaqah");
  const totalZakat = totalOf("zakat");
  const totalPurification = totalOf("purification");
  const totalFitr = totalOf("fitr");

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brass">Sadaqah and zakat</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Your giving</h1>
        <p className="mt-2 text-sm text-sage">
          Keep a record of what you give. Only zakat entries in{" "}
          {window.label.toLowerCase()} count toward outstanding. Purification of
          interest and Zakat al-Fitr are logged separately.
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
        {totalFitr > 0 && (
          <div className="card p-4">
            <p className="label">Zakat al-Fitr</p>
            <p className="mt-1 font-serif text-2xl text-ink nums">
              {formatMoney(totalFitr, settings.currency)}
            </p>
            <p className="mt-1 text-xs text-sage">All time · separate from zakat on wealth</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <a href="/api/export/giving" className="text-pine hover:underline" download>
          Download giving as CSV
        </a>
        <span className="text-mist">·</span>
        <Link href="/tools/fitr" className="text-pine hover:underline">
          Zakat al-Fitr calculator
        </Link>
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
