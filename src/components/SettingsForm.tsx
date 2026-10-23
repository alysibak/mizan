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
import { CurrencyOptions } from "@/components/public/VisitorCurrency";
import SettingsGroup from "@/components/SettingsGroup";
import { METALS_STALE_DAYS, metalsFreshness } from "@/lib/giving-window";
import { sendJson } from "@/lib/client-fetch";
import { readableDay } from "@/lib/dates";

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // Which part was saved last, so its "Saved." shows beside its own button.
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<{ part: string; text: string } | null>(null);
  const [part, setPart] = useState("zakat-day");

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
      }. Review, then save. Nothing changes until you save.`,
    );
  }

  async function saveSettings(payload: Record<string, unknown>, from = part) {
    setError(null);
    setSaved(null);
    setBusy(true);
    const res = await sendJson("/api/settings", "PUT", payload, "Could not save settings");
    setBusy(false);
    if (res.ok) {
      setSaved(from);
      router.refresh();
    } else {
      setError({ part: from, text: res.error });
    }
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Each part has its own Save button; all of the form is sent, as one.
    const from = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("data-part") ?? part;
    setPart(from);
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
    }, from);
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
    }, "metal-prices");
  }

  /** The Save button at the end of one part, with that part's result beside it. */
  const saveRow = (id: string, label: string) => (
    <div className="flex flex-wrap items-center gap-4">
      <button type="submit" data-part={id} disabled={busy} className="btn-primary">
        {busy && part === id ? "Saving…" : label}
      </button>
      {saved === id ? <span className="text-base text-gain">Saved.</span> : null}
      {error?.part === id ? (
        <span className="text-base text-danger" role="alert">
          {error.text}
        </span>
      ) : null}
    </div>
  );
  const money = (n: number) => formatMoney(n, settings.currency);

  return (
    <form onSubmit={save} className="border-t border-mist">
      <SettingsGroup
        id="zakat-day"
        title="Your zakat day"
        now={settings.hawlStartDate ? `Your year began ${readableDay(settings.hawlStartDate)}` : "Not set yet"}
        open={!settings.hawlStartDate}
      >
        <p className="text-base text-sage">
          Zakat is due a lunar year after the day you first had the minimum
          (nisab). Not sure? Many people keep 1 Ramadan.
        </p>
        <div className="max-w-xs">
          <label className="label mb-1.5" htmlFor="hawlStartDate">
            Your zakat year began on
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
            Islamic calendar
          </label>
          <select
            id="hijriCalendar"
            name="hijriCalendar"
            className="field"
            defaultValue={settings.hijriCalendar}
          >
            <option value="tabular">Worked out (used in most places)</option>
            <option value="umalqura">Saudi calendar (Umm al-Qura)</option>
          </select>
          <p className="mt-1.5 text-xs text-sage">
            Either may be a day off from the moon where you live.
          </p>
        </div>
        {saveRow("zakat-day", "Save zakat day")}
      </SettingsGroup>

      <SettingsGroup
        id="metal-prices"
        title="Gold and silver prices"
        now={`Gold ${money(settings.goldPricePerGram)}, silver ${money(settings.silverPricePerGram)} a gram`}
        open={freshness.stale}
      >
        <p className="text-base text-sage">
          The minimum (nisab) is a weight of gold or silver, so it moves with
          their prices.
        </p>
        <p className="text-sm text-sage">
          {settings.metalsUpdatedAt
            ? `Last saved ${readableDay(settings.metalsUpdatedAt)}. Check them at least every ${METALS_STALE_DAYS} days.`
            : "Not saved yet. Check them before you trust the minimum (nisab)."}
          {freshness.stale && freshness.reason === "aged"
            ? ` These are ${freshness.ageDays} days old.`
            : null}
          {freshness.stale && freshness.reason === "defaults"
            ? " These are only starting figures, not today’s prices."
            : null}
        </p>
        <button
          type="button"
          className="btn-ghost"
          onClick={suggestPrices}
          disabled={lookingUp || currency.length !== 3}
        >
          {lookingUp ? "Looking up…" : `Get today’s prices in ${currency}`}
        </button>
        {priceHint && <p className="text-sm text-sage">{priceHint}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5" htmlFor="goldPricePerGram">
              Gold, per gram ({currency})
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
              Minimum by gold:{" "}
              <span className="text-brassDeep nums">
                {formatMoney(goldNisab, currency)}
              </span>
            </p>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="silverPricePerGram">
              Silver, per gram ({currency})
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
              Minimum by silver:{" "}
              <span className="text-brassDeep nums">
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
            className="btn-ghost"
            disabled={busy}
            onClick={() => void confirmMetals()}
          >
            These prices are still right
          </button>
        ) : null}
        {saveRow("metal-prices", "Save prices")}
      </SettingsGroup>

      <SettingsGroup
        id="how-counted"
        title="How zakat is counted"
        now={`${settings.currency} · minimum by ${settings.nisabStandard} · ${MADHHAB_LABELS[parseMadhhab(settings.madhhab)]}`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5" htmlFor="currency">
              Your money
            </label>
            <select
              id="currency"
              name="currency"
              className="field"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <CurrencyOptions value={currency} />
            </select>
            <p className="mt-1.5 text-xs text-sage">Amounts are not converted, only labelled.</p>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="nisabStandard">
              The minimum (nisab) is set by
            </label>
            <select
              id="nisabStandard"
              name="nisabStandard"
              className="field"
              defaultValue={settings.nisabStandard}
            >
              <option value="silver">Silver (595 g): a lower minimum</option>
              <option value="gold">Gold (85 g): a higher minimum</option>
            </select>
            <p className="mt-1.5 text-xs text-sage">
              Not sure? Leave it on silver: many scholars advise it, as it is
              better for the poor.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="label mb-1.5" htmlFor="calendarBasis">
            Count the year by
          </label>
          <select
            id="calendarBasis"
            name="calendarBasis"
            className="field"
            defaultValue={settings.calendarBasis}
          >
            <option value="lunar">The lunar (Hijri) year: 2.5%</option>
            <option value="solar">The solar year: about 2.577%</option>
          </select>
          <p className="mt-1.5 text-xs text-sage">
            Most people use the lunar year. A solar year is 11 days longer, so
            its rate is a little higher to make up for it. That is a modern
            adjustment, not a separate rate from the Prophet ﷺ.
          </p>
        </div>

        <div className="mt-4">
          <label className="label mb-1.5" htmlFor="madhhab">
            Your madhhab (it changes how jewellery is counted)
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
            It does not change shares or pensions. Things you already added keep
            their part that counts until you change them.{" "}
            <Link href="/method" className="text-pine underline underline-offset-2">
              How it works
            </Link>
          </p>
        </div>
        {saveRow("how-counted", "Save these")}
      </SettingsGroup>
    </form>
  );
}
