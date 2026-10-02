"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
} from "@/lib/nisab";
import { formatMoney } from "@/lib/money";
import {
  MADHHABS,
  MADHHAB_LABELS,
  madhhabSummary,
  parseMadhhab,
  type Madhhab,
} from "@/lib/madhhab";
import type { Settings } from "@/db/schema";
import { COMMON_CURRENCIES } from "@/lib/currencies";
import { METALS_STALE_DAYS, metalsFreshness } from "@/lib/giving-window";
import { sendJson } from "@/lib/client-fetch";

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gold, setGold] = useState(settings.goldPricePerGram);
  const [silver, setSilver] = useState(settings.silverPricePerGram);
  const [currency, setCurrency] = useState(settings.currency);
  const [madhhab, setMadhhab] = useState<Madhhab>(parseMadhhab(settings.madhhab));
  const [priceHint, setPriceHint] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const goldNisab = NISAB_GOLD_GRAMS * gold;
  const silverNisab = NISAB_SILVER_GRAMS * silver;
  const freshness = metalsFreshness({
    gold: settings.goldPricePerGram,
    silver: settings.silverPricePerGram,
    metalsUpdatedAt: settings.metalsUpdatedAt,
  });
  const pricesDirty =
    gold !== settings.goldPricePerGram || silver !== settings.silverPricePerGram;

  async function suggestPrices() {
    setLookingUp(true);
    setPriceHint(null);
    const res = await fetch(`/api/metals?currency=${encodeURIComponent(currency)}`).catch(
      () => null,
    );
    const data = (await res?.json().catch(() => ({}))) ?? {};
    setLookingUp(false);
    if (!res?.ok) {
      setPriceHint(data.error || "Could not suggest prices. Enter them by hand.");
      return;
    }
    setGold(data.goldPricePerGram);
    setSilver(data.silverPricePerGram);
    setPriceHint(
      `Suggested from ${data.source}${
        data.asOf ? ` (${new Date(data.asOf).toLocaleString()})` : ""
      }. Review, then save. This does not change your ledger until you save.`,
    );
  }

  async function saveSettings(payload: Record<string, unknown>) {
    setError(null);
    setSaved(false);
    setBusy(true);
    const res = await sendJson("/api/settings", "PUT", payload, "Could not save settings");
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await saveSettings({
      currency: form.get("currency"),
      nisabStandard: form.get("nisabStandard"),
      calendarBasis: form.get("calendarBasis"),
      goldPricePerGram: form.get("goldPricePerGram"),
      silverPricePerGram: form.get("silverPricePerGram"),
      hawlStartDate: form.get("hawlStartDate") || null,
      madhhab: form.get("madhhab"),
      hijriCalendar: form.get("hijriCalendar"),
      setupComplete: settings.setupComplete,
      trustedAckAt: settings.trustedAckAt,
    });
  }

  async function confirmMetals() {
    await saveSettings({
      currency: settings.currency,
      nisabStandard: settings.nisabStandard,
      calendarBasis: settings.calendarBasis,
      goldPricePerGram: gold,
      silverPricePerGram: silver,
      hawlStartDate: settings.hawlStartDate,
      madhhab: settings.madhhab,
      setupComplete: settings.setupComplete,
      trustedAckAt: settings.trustedAckAt,
      touchMetals: true,
    });
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
              autoCapitalize="characters"
              autoComplete="off"
              className="field uppercase"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COMMON_CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={
                    "btn-ghost px-2.5 py-1 text-xs " +
                    (currency === c ? "border-pine text-pine" : "")
                  }
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-sage">
              A three-letter code such as CAD, USD, GBP, or AED. Changing it
              relabels figures; it does not convert holdings or metal prices.
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
            <option value="solar">Solar year — ~2.577% (calendar adjustment)</option>
          </select>
          <p className="mt-1.5 text-xs text-sage">
            The solar option scales 2.5% by year length so Gregorian reckoning
            does not under-assess. It is a modern adjustment, not a separate
            prophetic rate.
          </p>
        </div>

        <div className="mt-4">
          <label className="label mb-1.5" htmlFor="madhhab">
            School profile (jewellery defaults)
          </label>
          <select
            id="madhhab"
            name="madhhab"
            className="field"
            value={madhhab}
            onChange={(e) => setMadhhab(parseMadhhab(e.target.value))}
          >
            {MADHHABS.map((m) => (
              <option key={m} value={m}>
                {MADHHAB_LABELS[m]}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-sage">{madhhabSummary(madhhab)}</p>
          <p className="mt-1 text-xs text-sage">
            Does not invent classical rulings for stocks or pensions. Existing
            holdings keep their portions until you edit them.{" "}
            <Link href="/trust" className="text-pine hover:underline">
              What is verified
            </Link>
          </p>
        </div>
      </section>

      {/* Metal prices */}
      <section id="metal-prices" className="card scroll-mt-20 p-5">
        <h2 className="font-serif text-lg text-ink">Metal prices</h2>
        <p className="mt-1 text-sm text-sage">
          Nisab is a weight of gold or silver, so its cash value depends on the
          current price. You set these yourself. A suggestion from a free public
          source is optional — it never runs unless you ask, and it never saves
          until you do. Holdings entered by weight are revalued when you save.
        </p>
        <p className="mt-2 text-xs text-sage">
          {settings.metalsUpdatedAt
            ? `Last saved ${settings.metalsUpdatedAt.slice(0, 10)}. Reconfirm at least every ${METALS_STALE_DAYS} days.`
            : "No save date yet — confirm or update prices before trusting nisab."}
          {freshness.stale && freshness.reason === "aged"
            ? ` These are ${freshness.ageDays} days old.`
            : null}
          {freshness.stale && freshness.reason === "defaults"
            ? " Still matching seed defaults."
            : null}
        </p>
        <button
          type="button"
          className="btn-ghost mt-3"
          onClick={suggestPrices}
          disabled={lookingUp || currency.length !== 3}
        >
          {lookingUp ? "Looking up…" : `Suggest prices in ${currency}`}
        </button>
        {priceHint && <p className="mt-2 text-xs text-sage">{priceHint}</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5" htmlFor="goldPricePerGram">
              Gold price per gram ({currency})
            </label>
            <input
              id="goldPricePerGram"
              name="goldPricePerGram"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
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
              inputMode="decimal"
              step="0.0001"
              min="0.0001"
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
        {!pricesDirty &&
        freshness.stale &&
        freshness.reason !== "defaults" ? (
          <button
            type="button"
            className="btn-ghost mt-4"
            disabled={busy}
            onClick={() => void confirmMetals()}
          >
            Confirm prices still current
          </button>
        ) : null}
      </section>

      {/* Hawl */}
      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Hawl start date</h2>
        <p className="mt-1 text-sm text-sage">
          The ledger date wealth last crossed nisab. Payable zakat uses this
          date. Optional per-holding dates on the ledger are reminders only.
          Zakat falls due one lunar year later.
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
        <div className="mt-4 max-w-xs">
          <label className="label mb-1.5" htmlFor="hijriCalendar">
            Hijri calendar
          </label>
          <select
            id="hijriCalendar"
            name="hijriCalendar"
            className="field"
            defaultValue={settings.hijriCalendar}
          >
            <option value="tabular">Tabular (arithmetic)</option>
            <option value="umalqura">Umm al-Qura</option>
          </select>
          <p className="mt-1.5 text-xs text-sage">
            Umm al-Qura follows Saudi Arabia&apos;s published tables, which
            match many printed calendars. Either can differ by a day from local
            moon-sighting.
          </p>
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
