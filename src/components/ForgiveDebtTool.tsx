"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney, toCents } from "@/lib/money";
import { sendJson } from "@/lib/client-fetch";

type Receivable = { id: string; label: string; amount: number };

/**
 * Forgiving a debt someone owed you: it comes off what you are owed, so it is
 * no longer counted in your zakat. Nothing is written down as sadaqah: that
 * is between you and Allah.
 */
export default function ForgiveDebtTool({
  currency,
  receivables,
}: {
  currency: string;
  receivables: Receivable[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [assetId, setAssetId] = useState(receivables[0]?.id ?? "");
  const selected = receivables.find((r) => r.id === assetId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    const amount = Number(new FormData(e.currentTarget).get("amount"));
    const left = Math.max(0, toCents(selected.amount - amount));
    const res =
      left <= 0.009
        ? await sendJson(`/api/assets/${selected.id}`, "DELETE")
        : await sendJson(`/api/assets/${selected.id}`, "PATCH", { amount: left });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
    router.refresh();
  }

  const header = (
    <header>
      <p className="label text-brassDeep">Release</p>
      <h1 className="mt-1 font-serif text-3xl text-ink">Forgive a debt</h1>
      <p className="mt-2 max-w-xl text-sm text-sage">
        “If the one who owes is in hardship, give him time until it eases; and to let it go as charity is better for
        you, if only you knew” (Quran 2:280). Forgiven money is no longer yours to count, so it comes off what you are
        owed. There is nothing to write down: it is between you and Allah.
      </p>
    </header>
  );

  if (done) {
    return (
      <div className="space-y-8">
        {header}
        <section className="border border-pine/40 bg-pine/5 px-5 py-6" role="status">
          <p className="font-serif text-xl text-ink">Done. It is no longer counted in your zakat.</p>
          <p className="mt-2 text-sm text-sage">May Allah accept it from you and make it easy for them.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary">
              See my zakat
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!receivables.length) {
    return (
      <div className="space-y-8">
        {header}
        <p className="card max-w-lg p-5 text-sm text-sage">
          Nothing to change: no money owed to you is on your ledger, so none is counted in your zakat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {header}
      <form onSubmit={onSubmit} className="card max-w-lg space-y-4 p-5">
        <div>
          <label className="label mb-1.5" htmlFor="asset">
            Who owed you
          </label>
          <select id="asset" className="field" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            {receivables.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} ({formatMoney(r.amount, currency)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="amount">
            How much you let go ({currency})
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            max={selected?.amount}
            step="0.01"
            className="field nums"
            required
            defaultValue={selected?.amount}
            key={selected?.id}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Take it off what I am owed"}
        </button>
      </form>
    </div>
  );
}
