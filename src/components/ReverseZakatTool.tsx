"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/money";
import { impliedWealthFromZakat } from "@/lib/unique-calcs";
import type { CalendarBasis } from "@/lib/zakat";

export default function ReverseZakatTool({
  currency,
  basis = "lunar",
}: {
  currency: string;
  basis?: CalendarBasis;
}) {
  const [amount, setAmount] = useState("");
  const [useBasis, setUseBasis] = useState<CalendarBasis>(basis);

  const wealth = useMemo(
    () => impliedWealthFromZakat(parseFloat(amount) || 0, useBasis),
    [amount, useBasis],
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brassDeep">Work backwards</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Reverse zakat</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          Most tools ask “what do I owe?” This one asks the rarer question: if I
          intend to give this much, how much net zakatable wealth does that
          assume — at the rate on your calendar basis.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label mb-1.5" htmlFor="gift">
            Zakat I plan to give ({currency})
          </label>
          <input
            id="gift"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className="field nums"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="label mb-1.5" htmlFor="basis">
            Rate basis
          </label>
          <select
            id="basis"
            className="field"
            value={useBasis}
            onChange={(e) => setUseBasis(e.target.value as CalendarBasis)}
          >
            <option value="lunar">Lunar — 2.5%</option>
            <option value="solar">Solar — ~2.577%</option>
          </select>
        </div>
      </div>

      <section className="border border-pine/30 bg-pine/5 px-5 py-6">
        <p className="label text-pine">Implied net zakatable</p>
        <p className="mt-1 font-serif text-4xl text-ink nums">
          {wealth > 0 ? formatMoney(wealth, currency) : "—"}
        </p>
        <p className="mt-2 text-sm text-sage">
          Pure division by the rate. It ignores nisab, hawl, and portions — a
          planning sketch, not a statement.
        </p>
      </section>
    </div>
  );
}
