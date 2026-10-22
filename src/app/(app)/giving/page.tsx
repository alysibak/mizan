import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { loadReckoning } from "@/lib/reckoning";
import { formatMoney, sumCents, toCents } from "@/lib/money";
import { parseGivingType } from "@/lib/giving";
import GivingManager from "@/components/GivingManager";
import { parseAsnaf } from "@/lib/asnaf";

function parseAmount(value?: string): number | undefined {
  if (!value) return undefined;
  const n = toCents(Number(value));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default async function GivingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; amount?: string; asnaf?: string; cleared?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const params = await searchParams;
  const defaultType = parseGivingType(params.type) ?? "zakat";
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
    sumCents(rows.filter((r) => r.type === type).map((r) => r.amount));
  const totalZakat = totalOf("zakat");
  const totalPurification = totalOf("purification");
  const totalFitr = totalOf("fitr");

  return (
    <div className="space-y-6">
      <header>
        <p className="label text-brassDeep">Give</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">What you have given</h1>
        <p className="mt-2 text-sm text-sage">
          Note the zakat you give, so you know what is still to give{" "}
          {window.label.toLowerCase()}. There is no need to note sadaqah: give
          it, and let it go.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="label">Zakat given · {window.label}</p>
          <p className="mt-1 font-serif text-2xl text-pine nums">
            {formatMoney(zakatCycle, settings.currency)}
          </p>
          <p className="mt-1 text-xs text-sage">
            {outstanding > 0 && result.isDue
              ? `${formatMoney(outstanding, settings.currency)} still to give`
              : "Toward this year’s zakat"}
          </p>
        </div>
        <div className="card p-4">
          <p className="label">Zakat given, all years</p>
          <p className="mt-1 font-serif text-2xl text-ink nums">
            {formatMoney(totalZakat, settings.currency)}
          </p>
        </div>
        {totalPurification > 0 && (
          <div className="card p-4">
            <p className="label">Interest given away</p>
            <p className="mt-1 font-serif text-2xl text-sage nums">
              {formatMoney(totalPurification, settings.currency)}
            </p>
            <p className="mt-1 text-xs text-sage">Not counted as zakat</p>
          </div>
        )}
        {totalFitr > 0 && (
          <div className="card p-4">
            <p className="label">Zakat al-Fitr</p>
            <p className="mt-1 font-serif text-2xl text-ink nums">
              {formatMoney(totalFitr, settings.currency)}
            </p>
            <p className="mt-1 text-xs text-sage">All years · separate from your yearly zakat</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {rows.length > 0 ? (
          <>
            <a href="/api/export/giving" className="text-pine hover:underline" download>
              Download this list
            </a>
            <span className="text-sage">·</span>
          </>
        ) : null}
        <Link href="/zakat-al-fitr" className="text-pine hover:underline">
          Work out Zakat al-Fitr
        </Link>
      </div>

      <GivingManager
        key={`${defaultType}-${defaultAmount ?? ""}-${defaultAsnaf ?? ""}`}
        records={rows}
        currency={settings.currency}
        defaultType={defaultType}
        defaultAmount={defaultAmount}
        defaultAsnaf={defaultAsnaf}
        cycleOutstanding={outstanding}
        cyclePayable={phase === "payable"}
        cleared={params.cleared === "1"}
      />
    </div>
  );
}
