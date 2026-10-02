"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Settings } from "@/db/schema";
import {
  MADHHABS,
  MADHHAB_LABELS,
  categoryForMadhhab,
  madhhabSummary,
  parseMadhhab,
  type Madhhab,
} from "@/lib/madhhab";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "@/lib/nisab";
import { formatMoney } from "@/lib/money";
import { COMMON_CURRENCIES } from "@/lib/currencies";
import { sendJson } from "@/lib/client-fetch";

const STEPS = ["Trust", "Preferences", "Prices", "Hawl", "Holding"] as const;
const STEP_KEY = "mizan-begin-step";

export default function BeginWizard({
  name,
  settings,
}: {
  name: string;
  settings: Settings;
}) {
  const router = useRouter();
  const [step, setStep] = useState(settings.trustedAckAt ? 1 : 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currency, setCurrency] = useState(settings.currency || "CAD");
  const [nisabStandard, setNisabStandard] = useState(settings.nisabStandard);
  const [calendarBasis, setCalendarBasis] = useState(settings.calendarBasis);
  const [madhhab, setMadhhab] = useState<Madhhab>(parseMadhhab(settings.madhhab));
  const [gold, setGold] = useState(settings.goldPricePerGram);
  const [silver, setSilver] = useState(settings.silverPricePerGram);
  const [hawlStartDate, setHawlStartDate] = useState(settings.hawlStartDate ?? "");
  const [trustedAckAt, setTrustedAckAt] = useState(settings.trustedAckAt);
  const [lookingUp, setLookingUp] = useState(false);
  const [priceHint, setPriceHint] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!settings.trustedAckAt) {
        setStep(0);
        return;
      }
      const saved = localStorage.getItem(STEP_KEY);
      if (saved == null) return;
      const n = parseInt(saved, 10);
      if (n >= 1 && n < STEPS.length) setStep(n);
    } catch {
      /* ignore */
    }
  }, [settings.trustedAckAt]);

  function go(n: number) {
    setStep(n);
    try {
      localStorage.setItem(STEP_KEY, String(n));
    } catch {
      /* ignore */
    }
  }

  const [assetLabel, setAssetLabel] = useState("");
  const [assetAmount, setAssetAmount] = useState("");
  const [assetCategory, setAssetCategory] = useState("bank");
  // Set once the first holding is saved, so retrying a failed finish does
  // not add it twice.
  const [assetSaved, setAssetSaved] = useState(false);

  async function saveSettings(patch: Record<string, unknown>) {
    const body = {
      currency,
      nisabStandard,
      calendarBasis,
      goldPricePerGram: gold,
      silverPricePerGram: silver,
      hawlStartDate: hawlStartDate || null,
      madhhab,
      trustedAckAt,
      setupComplete: false,
      ...patch,
    };
    const res = await sendJson("/api/settings", "PUT", body, "Could not save");
    if (!res.ok) throw new Error(res.error);
  }

  async function suggestPrices() {
    setLookingUp(true);
    setPriceHint(null);
    const res = await fetch(`/api/metals?currency=${encodeURIComponent(currency)}`).catch(
      () => null,
    );
    const data = (await res?.json().catch(() => ({}))) ?? {};
    setLookingUp(false);
    if (!res?.ok) {
      setPriceHint(data.error || "Enter prices by hand");
      return;
    }
    setGold(data.goldPricePerGram);
    setSilver(data.silverPricePerGram);
    setPriceHint(`Suggested from ${data.source}. Review before continuing.`);
  }

  async function nextFromTrust() {
    setBusy(true);
    setError(null);
    try {
      const at = new Date().toISOString();
      await saveSettings({ trustedAckAt: at });
      setTrustedAckAt(at);
      go(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not continue");
    }
    setBusy(false);
  }

  async function nextFromPreferences() {
    setBusy(true);
    setError(null);
    try {
      await saveSettings({});
      go(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
    setBusy(false);
  }

  async function nextFromPrices() {
    if (!(gold > 0) || !(silver > 0)) {
      setError("Enter gold and silver prices greater than zero");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveSettings({});
      go(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
    setBusy(false);
  }

  /** `date` is passed explicitly: "Set later" clears it in the same click. */
  async function nextFromHawl(date: string) {
    setBusy(true);
    setError(null);
    try {
      await saveSettings({ hawlStartDate: date || null });
      go(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
    setBusy(false);
  }

  async function finish(withAsset: boolean) {
    setBusy(true);
    setError(null);
    try {
      if (withAsset && !assetSaved) {
        const amount = parseFloat(assetAmount);
        if (!assetLabel.trim() || !(amount >= 0)) {
          setError("Add a description and amount, or skip this step");
          setBusy(false);
          return;
        }
        const portion = categoryForMadhhab(assetCategory, madhhab).defaultZakatablePortion;
        const res = await sendJson(
          "/api/assets",
          "POST",
          {
            category: assetCategory,
            label: assetLabel.trim(),
            amount,
            zakatablePortion: portion,
          },
          "Could not add holding",
        );
        if (!res.ok) throw new Error(res.error);
        setAssetSaved(true);
      }
      await saveSettings({
        hawlStartDate: hawlStartDate || null,
        setupComplete: true,
      });
      try {
        localStorage.removeItem(STEP_KEY);
        localStorage.setItem("mizan-just-begun", "1");
      } catch {
        /* ignore */
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish setup");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brass">Begin</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">
          {name}, set your ledger
        </h1>
        <p className="mt-2 text-sm text-sage">
          A few steps so the first reckoning is yours — not blind defaults.
        </p>
      </header>

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={
              "text-xs tracking-wide " +
              (i === step
                ? "font-medium text-pine"
                : i < step
                  ? "text-sage"
                  : "text-mist")
            }
          >
            {i + 1}. {label}
            {i < STEPS.length - 1 ? <span className="mx-2 text-mist">/</span> : null}
          </li>
        ))}
      </ol>

      <div className="h-1 bg-mist">
        <div
          className="h-full bg-pine transition-all duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {step === 0 && (
        <section className="space-y-5">
          <h2 className="font-serif text-xl text-ink">Before numbers</h2>
          <p className="text-sm leading-relaxed text-sage">
            Mizan verifies arithmetic from figures you enter. It is an estimate,
            not a fatwa. Disputed items (jewellery, equities, pensions) stay
            editable. For a real obligation, ask a qualified person of knowledge.
          </p>
          <p className="text-sm leading-relaxed text-sage">
            Read{" "}
            <Link href="/trust" className="text-pine hover:underline" target="_blank">
              what is verified
            </Link>{" "}
            anytime.
          </p>
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={nextFromTrust}
          >
            I understand — continue
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-5">
          <h2 className="font-serif text-xl text-ink">Preferences</h2>
          <div>
            <label className="label mb-1.5" htmlFor="currency">
              Currency
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={
                    "btn-ghost px-3 py-1.5 text-sm " +
                    (currency === c ? "border-pine text-pine" : "")
                  }
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              id="currency"
              autoCapitalize="characters"
              autoComplete="off"
              className="field mt-2 max-w-[8rem] uppercase"
              maxLength={3}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="nisab">
              Nisab standard
            </label>
            <select
              id="nisab"
              className="field"
              value={nisabStandard}
              onChange={(e) => setNisabStandard(e.target.value)}
            >
              <option value="silver">Silver (595g) — lower threshold</option>
              <option value="gold">Gold (85g) — higher threshold</option>
            </select>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="calendar">
              Calendar
            </label>
            <select
              id="calendar"
              className="field"
              value={calendarBasis}
              onChange={(e) => setCalendarBasis(e.target.value)}
            >
              <option value="lunar">Lunar — 2.5%</option>
              <option value="solar">Solar — ~2.577% (adjustment)</option>
            </select>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="madhhab">
              School (jewellery defaults)
            </label>
            <select
              id="madhhab"
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
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-ghost" onClick={() => go(0)}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || currency.length !== 3}
              onClick={nextFromPreferences}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <h2 className="font-serif text-xl text-ink">Metal prices</h2>
          <p className="text-sm text-sage">
            Nisab is a weight. You set the cash price per gram. Suggestion is
            optional and never saves until you continue.
          </p>
          <button
            type="button"
            className="btn-ghost"
            disabled={lookingUp || currency.length !== 3}
            onClick={suggestPrices}
          >
            {lookingUp ? "Looking up…" : `Suggest prices in ${currency}`}
          </button>
          {priceHint && <p className="text-xs text-sage">{priceHint}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label mb-1.5" htmlFor="gold">
                Gold / gram
              </label>
              <input
                id="gold"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="field nums"
                value={gold}
                onChange={(e) => setGold(parseFloat(e.target.value) || 0)}
              />
              <p className="mt-1 text-xs text-sage">
                Gold nisab ≈{" "}
                <span className="nums text-brass">
                  {formatMoney(NISAB_GOLD_GRAMS * gold, currency)}
                </span>
              </p>
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="silver">
                Silver / gram
              </label>
              <input
                id="silver"
                type="number"
                inputMode="decimal"
                step="0.0001"
                min="0"
                className="field nums"
                value={silver}
                onChange={(e) => setSilver(parseFloat(e.target.value) || 0)}
              />
              <p className="mt-1 text-xs text-sage">
                Silver nisab ≈{" "}
                <span className="nums text-brass">
                  {formatMoney(NISAB_SILVER_GRAMS * silver, currency)}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-ghost" onClick={() => go(1)}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={nextFromPrices}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5">
          <h2 className="font-serif text-xl text-ink">Hawl start</h2>
          <p className="text-sm text-sage">
            The day your wealth last crossed nisab. You can set this later.
            Payment day should still follow local moon-sighting.
          </p>
          <div className="max-w-xs">
            <label className="label mb-1.5" htmlFor="hawl">
              Date (optional)
            </label>
            <input
              id="hawl"
              type="date"
              className="field"
              value={hawlStartDate}
              onChange={(e) => setHawlStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-ghost" onClick={() => go(2)}>
              Back
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={busy}
              onClick={() => {
                setHawlStartDate("");
                void nextFromHawl("");
              }}
            >
              Set later
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void nextFromHawl(hawlStartDate)}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-5">
          <h2 className="font-serif text-xl text-ink">First holding</h2>
          <p className="text-sm text-sage">
            Optional. Add one balance now, or open an empty ledger and fill it
            on the Ledger page.
          </p>
          <div className="grid gap-4">
            <div>
              <label className="label mb-1.5" htmlFor="cat">
                Category
              </label>
              <select
                id="cat"
                className="field"
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value)}
              >
                <option value="bank">Bank balances</option>
                <option value="cash">Cash on hand</option>
                <option value="gold">Gold (investment)</option>
                <option value="silver">Silver</option>
                <option value="receivables">Money owed to you</option>
                <option value="business_inventory">Business inventory</option>
                <option value="stocks_longterm">Stocks (long-term)</option>
                <option value="stocks_trading">Stocks (trading)</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="pension">Pension / retirement</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="alabel">
                Description
              </label>
              <input
                id="alabel"
                className="field"
                value={assetLabel}
                onChange={(e) => setAssetLabel(e.target.value)}
                placeholder="e.g. Chequing"
              />
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="aamount">
                Amount ({currency})
              </label>
              <input
                id="aamount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className="field nums"
                value={assetAmount}
                onChange={(e) => setAssetAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-ghost" onClick={() => go(3)}>
              Back
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={busy}
              onClick={() => finish(false)}
            >
              Skip — open ledger
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => finish(true)}
            >
              {busy ? "Saving…" : "Add and finish"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
