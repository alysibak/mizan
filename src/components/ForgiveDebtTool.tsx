"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney, toCents } from "@/lib/money";
import { localIsoDay } from "@/lib/dates";
import { sendJson } from "@/lib/client-fetch";

type Receivable = { id: string; label: string; amount: number };

/**
 * Record forgiving a debt — as sadaqah — and optionally lower the receivable.
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
  const [assetId, setAssetId] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => setDate((d) => d || localIsoDay()), []);

  const selected = receivables.find((r) => r.id === assetId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const who = String(form.get("who") || "").trim();
    const amount = Number(form.get("amount"));
    const note = [
      who ? `Forgave debt owed by ${who}` : "Forgave a debt owed to me",
      selected ? `Receivable: ${selected.label}` : "",
      form.get("note") ? String(form.get("note")) : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const res = await sendJson(
      "/api/giving",
      "POST",
      {
        amount,
        type: "sadaqah",
        recipient: (who || selected?.label || "Debt forgiven").slice(0, 120),
        note: note.slice(0, 400),
        date: form.get("date") || localIsoDay(),
      },
      "Could not record",
    );
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }

    if (selected && amount > 0) {
      const nextAmount = Math.max(0, toCents(selected.amount - amount));
      const update =
        nextAmount <= 0.009
          ? await sendJson(`/api/assets/${selected.id}`, "DELETE")
          : await sendJson(`/api/assets/${selected.id}`, "PATCH", { amount: nextAmount });
      if (!update.ok) {
        // The gift is recorded; say plainly that the ledger still needs a touch.
        setError(
          `Recorded as sadaqah, but the receivable could not be updated (${update.error}). Adjust it on the ledger.`,
        );
        setBusy(false);
        router.refresh();
        return;
      }
    }

    setBusy(false);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <section className="border border-pine/40 bg-pine/5 px-5 py-6">
        <p className="label text-pine">Recorded</p>
        <p className="mt-1 font-serif text-xl text-ink">
          Forgiveness is on your giving history as sadaqah.
        </p>
        <p className="mt-2 text-sm text-sage">
          {selected
            ? "The linked receivable was lowered or removed so the scale stays honest."
            : "If a receivable remains on the ledger, adjust it when you can."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/assets" className="btn-primary">
            Open ledger
          </Link>
          <Link href="/giving" className="btn-ghost">
            View giving
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brass">Release</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Forgive a debt</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          When you let go of money someone owed you, record it as sadaqah — and
          optionally lower that receivable on the ledger in the same step.
        </p>
      </header>

      <form onSubmit={onSubmit} className="card max-w-lg space-y-4 p-5">
        {receivables.length > 0 ? (
          <div>
            <label className="label mb-1.5" htmlFor="asset">
              Receivable on the ledger (optional)
            </label>
            <select
              id="asset"
              className="field"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
            >
              <option value="">None — record only</option>
              {receivables.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} ({formatMoney(r.amount, currency)})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label className="label mb-1.5" htmlFor="amount">
            Amount forgiven ({currency})
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            className="field nums"
            required
            defaultValue={selected ? selected.amount : undefined}
            key={selected?.id ?? "none"}
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="who">
            Who owed you (optional)
          </label>
          <input
            id="who"
            name="who"
            className="field"
            placeholder="Initials or name"
            defaultValue={selected?.label ?? ""}
            key={`who-${selected?.id ?? "none"}`}
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field"
            required
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="note">
            Note (optional)
          </label>
          <input id="note" name="note" className="field" />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Record forgiveness"}
        </button>
      </form>
    </div>
  );
}
