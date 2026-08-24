"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
} from "@/lib/nisab";
import { formatMoney } from "@/lib/money";
import type { Settings } from "@/db/schema";

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gold, setGold] = useState(settings.goldPricePerGram);
  const [silver, setSilver] = useState(settings.silverPricePerGram);
  const [currency, setCurrency] = useState(settings.currency);

  const goldNisab = NISAB_GOLD_GRAMS * gold;
  const silverNisab = NISAB_SILVER_GRAMS * silver;

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency: form.get("currency"),
        nisabStandard: form.get("nisabStandard"),
        calendarBasis: form.get("calendarBasis"),
        goldPricePerGram: form.get("goldPricePerGram"),
        silverPricePerGram: form.get("silverPricePerGram"),
        hawlStartDate: form.get("hawlStartDate") || null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not save settings");
    }
  }

  return (
    <form onSubmit={save} className="space-y-8">
      {/* Currency + standard */}
      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Preferences</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5" htmlFor="currency">
              Currency code
            </label>
            <input
              id="currency"
              name="currency"
              maxLength={3}
              className="field uppercase"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
            <p className="mt-1.5 text-xs text-sage">
              A three-letter code such as CAD, USD, GBP, or AED.
            </p>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="nisabStandard">
              Nisab standard
            </label>
            <select
              id="nisabStandard"
              name="nisabStandard"
              className="field"
              defaultValue={settings.nisabStandard}
            >
              <option value="silver">Silver (595g) — lower threshold</option>
              <option value="gold">Gold (85g) — higher threshold</option>
            </select>
            <p className="mt-1.5 text-xs text-sage">
              Many follow the silver standard since it is lower, so more is given.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="label mb-1.5" htmlFor="calendarBasis">
            Calendar basis
          </label>
          <select
            id="calendarBasis"
            name="calendarBasis"
            className="field"
            defaultValue={settings.calendarBasis}
          >
            <option value="lunar">Lunar year — 2.5%</option>
            <option value="solar">Solar year — 2.577% (adjusted)</option>
          </select>
          <p className="mt-1.5 text-xs text-sage">
            If you reckon on the Gregorian calendar, the adjusted rate keeps the
            assessment fair across the slightly longer solar year.
          </p>
        </div>
      </section>

      {/* Metal prices */}
      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Metal prices</h2>
        <p className="mt-1 text-sm text-sage">
          Nisab is a weight of gold or silver, so its cash value depends on the
          current price. You set these yourself, which is why Mizan never needs a
          paid price feed to work. Update them when you calculate.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5" htmlFor="goldPricePerGram">
              Gold price per gram ({currency})
            </label>
            <input
              id="goldPricePerGram"
              name="goldPricePerGram"
              type="number"
              step="0.01"
              min="0"
              className="field nums"
              value={gold}
              onChange={(e) => setGold(parseFloat(e.target.value) || 0)}
            />
            <p className="mt-1.5 text-xs text-sage">
              Gold nisab ={" "}
              <span className="text-brass nums">
                {formatMoney(goldNisab, currency)}
              </span>
            </p>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="silverPricePerGram">
              Silver price per gram ({currency})
            </label>
            <input
              id="silverPricePerGram"
              name="silverPricePerGram"
              type="number"
              step="0.01"
              min="0"
              className="field nums"
              value={silver}
              onChange={(e) => setSilver(parseFloat(e.target.value) || 0)}
            />
            <p className="mt-1.5 text-xs text-sage">
              Silver nisab ={" "}
              <span className="text-brass nums">
                {formatMoney(silverNisab, currency)}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Hawl */}
      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Hawl start date</h2>
        <p className="mt-1 text-sm text-sage">
          The date your wealth last crossed nisab. Zakat falls due one lunar year
          after this date. If your wealth dips below nisab and later recovers,
          reset this to the new crossing date.
        </p>
        <div className="mt-4 max-w-xs">
          <label className="label mb-1.5" htmlFor="hawlStartDate">
            Date wealth reached nisab
          </label>
          <input
            id="hawlStartDate"
            name="hawlStartDate"
            type="date"
            className="field"
            defaultValue={settings.hawlStartDate ?? ""}
          />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-gain">Saved.</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </form>
  );
}
