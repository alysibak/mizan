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
        <p className="label text-brassDeep">Work back</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Work back from what you gave</h1>
        <p className="mt-2 max-w-xl text-base text-sage">
          Type an amount of zakat, and see how much you would need to own for
          that to be your zakat.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label mb-1.5" htmlFor="gift">
            Zakat given, or to give ({currency})
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
            Year counted by
          </label>
          <select
            id="basis"
            className="field"
            value={useBasis}
            onChange={(e) => setUseBasis(e.target.value as CalendarBasis)}
          >
            <option value="lunar">Lunar year: 2.5%</option>
            <option value="solar">Solar year: about 2.577%</option>
          </select>
        </div>
      </div>

      <section className="border border-pine/30 bg-pine/5 px-5 py-6">
        <p className="label text-pine">You would need to own</p>
        <p className="mt-1 font-serif text-4xl text-ink nums">
          {wealth > 0 ? formatMoney(wealth, currency) : "—"}
        </p>
        <p className="mt-2 text-sm text-sage">
          Only a rough guide: it does not check the minimum (nisab), your zakat
          day, or what counts in full.
        </p>
      </section>
    </div>
  );
}
