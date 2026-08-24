"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import type { GivingRecord } from "@/db/schema";

export default function GivingManager({
  records,
  currency,
}: {
  records: GivingRecord[];
  currency: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function addRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/giving", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: form.get("amount"),
        type: form.get("type"),
        recipient: form.get("recipient"),
        note: form.get("note"),
        date: form.get("date"),
      }),
    });
    setBusy(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not record this gift");
    }
  }

  async function removeRecord(id: string) {
    await fetch(`/api/giving/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Record a gift</h2>
        <form onSubmit={addRecord} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label mb-1.5" htmlFor="amount">
                Amount ({currency})
              </label>
              <input id="amount" name="amount" type="number" step="0.01" min="0.01" className="field nums" placeholder="0.00" required />
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="type">
                Type
              </label>
              <select id="type" name="type" className="field" defaultValue="sadaqah">
                <option value="sadaqah">Sadaqah (voluntary)</option>
                <option value="zakat">Zakat (obligatory)</option>
              </select>
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="date">
                Date
              </label>
              <input id="date" name="date" type="date" defaultValue={today} className="field" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label mb-1.5" htmlFor="recipient">
                Recipient (optional)
              </label>
              <input id="recipient" name="recipient" className="field" placeholder="e.g. local food bank" />
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="note">
                Note (optional)
              </label>
              <input id="note" name="note" className="field" placeholder="e.g. Ramadan" />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary">
            Record gift
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg text-ink">
          History{" "}
          <span className="text-sm font-normal text-sage">({records.length})</span>
        </h2>
        {records.length === 0 ? (
          <p className="card p-5 text-sm text-sage">
            Nothing recorded yet. Your giving will appear here, newest first.
          </p>
        ) : (
          <ul className="divide-y divide-mist overflow-hidden card">
            {records.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    {r.recipient || (r.type === "zakat" ? "Zakat" : "Sadaqah")}
                  </p>
                  <p className="text-xs text-sage">
                    {r.date}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-ink nums">
                      {formatMoney(r.amount, currency)}
                    </p>
                    <p
                      className={
                        "text-xs " +
                        (r.type === "zakat" ? "text-pine" : "text-brass")
                      }
                    >
                      {r.type}
                    </p>
                  </div>
                  <button
                    onClick={() => removeRecord(r.id)}
                    className="text-sage transition hover:text-danger"
                    aria-label="Remove record"
                  >
                    &times;
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
