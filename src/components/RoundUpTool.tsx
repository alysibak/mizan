"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { roundUpGap, roundUpTotal } from "@/lib/roundup";
import { formatMoney } from "@/lib/money";

const INCREMENTS = [
  { value: 1, label: "Nearest 1" },
  { value: 5, label: "Nearest 5" },
  { value: 10, label: "Nearest 10" },
];

export default function RoundUpTool({ currency }: { currency: string }) {
  const router = useRouter();
  const [spend, setSpend] = useState("");
  const [increment, setIncrement] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const amount = parseFloat(spend) || 0;
  const gap = useMemo(() => roundUpGap(amount, increment), [amount, increment]);
  const total = useMemo(() => roundUpTotal(amount, increment), [amount, increment]);

  async function record() {
    if (gap <= 0) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/giving", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: gap,
        type: "sadaqah",
        note: `Round-up from ${amount.toFixed(2)} → ${total.toFixed(2)}`,
        date: new Date().toISOString().slice(0, 10),
      }),
    });
    setBusy(false);
    if (res.ok) {
      setSpend("");
      setMessage(`Recorded ${formatMoney(gap, currency)} as sadaqah.`);
      router.refresh();
    } else {
      setMessage("Could not record this round-up.");
    }
  }

  return (
    <section className="panel">
      <h2 className="font-serif text-lg text-ink">Round-up sadaqah</h2>
      <p className="mt-1 text-sm text-sage">
        Enter what you spent. Mizan suggests the change to the next step — give
        that away as voluntary charity. No bank link required.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label mb-1.5" htmlFor="spend">
            Purchase ({currency})
          </label>
          <input
            id="spend"
            type="number"
            step="0.01"
            min="0"
            className="field nums"
            value={spend}
            onChange={(e) => setSpend(e.target.value)}
            placeholder="12.40"
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="increment">
            Round to
          </label>
          <select
            id="increment"
            className="field"
            value={increment}
            onChange={(e) => setIncrement(Number(e.target.value))}
          >
            {INCREMENTS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-sm text-ink">
            Give{" "}
            <span className="font-medium nums text-brass">
              {formatMoney(gap, currency)}
            </span>
          </p>
          {gap > 0 && (
            <p className="text-xs text-sage">
              {formatMoney(amount, currency)} → {formatMoney(total, currency)}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        className="btn-primary mt-4"
        disabled={busy || gap <= 0}
        onClick={record}
      >
        {busy ? "Recording…" : "Record as sadaqah"}
      </button>
      {message && <p className="mt-2 text-sm text-sage">{message}</p>}
    </section>
  );
}
