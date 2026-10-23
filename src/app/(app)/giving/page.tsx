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
  // Sadaqah is given and let go, not noted: an old link to it opens zakat.
  const asked = parseGivingType(params.type);
  const defaultType = asked && asked !== "sadaqah" ? asked : "zakat";
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

  const money = (n: number) => formatMoney(n, settings.currency);
  // Everything else given, all years, in one line under the list.
  const others = [
    totalZakat > zakatCycle ? `${money(totalZakat)} zakat in all years` : null,
    totalPurification > 0 ? `${money(totalPurification)} interest given away (not zakat)` : null,
    totalFitr > 0 ? `${money(totalFitr)} Zakat al-Fitr` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl text-ink">What you gave</h1>
        {/* One line: what is given this year, and what is left. */}
        <p className="mt-2 text-lg text-ink nums">
          <span className="text-pine">{money(zakatCycle)} given</span>
          {outstanding > 0 && result.isDue ? <> · {money(outstanding)} still to give</> : null}
          <span className="block text-sm text-sage">{window.label}</span>
        </p>
      </header>

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

      {others.length ? <p className="text-sm text-sage nums">Also: {others.join(" · ")}.</p> : null}

      <div className="flex flex-wrap items-center gap-x-3 text-sm">
        {rows.length > 0 ? (
          <>
            <a href="/api/export/giving" className="inline-flex min-h-[44px] items-center text-pine hover:underline" download>
              Download this list
            </a>
            <span className="text-sage" aria-hidden>
              ·
            </span>
          </>
        ) : null}
        <Link href="/zakat-al-fitr" className="inline-flex min-h-[44px] items-center text-pine hover:underline">
          Work out Zakat al-Fitr
        </Link>
      </div>
    </div>
  );
}
