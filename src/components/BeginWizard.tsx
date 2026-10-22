"use client";

import { useState } from "react";
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
import { metalsLookLikeDefaults } from "@/lib/giving-window";
import { CurrencySelect } from "@/components/public/VisitorCurrency";
import { sendJson } from "@/lib/client-fetch";
import { readStoredValue, setStoredValue, useHydrated } from "@/lib/client-store";
import {
  CALC_STORAGE_KEY,
  VISITOR_CURRENCY_KEY,
  currencyForLocale,
  decimalMarkFor,
  draftIsEmpty,
  draftToLedger,
  parseDraft,
  type CalcDraft,
  type LedgerCarryOver,
} from "@/lib/calculator";
import { MY_KEY, lastZakatDay, parseMy, paymentsTotal } from "@/lib/my-zakat";
import { HIJRI_MONTHS } from "@/lib/hijri";

const STEPS = ["Before we start", "Your money", "Prices", "Zakat day", "What you have"] as const;
const STEP_KEY = "mizan-begin-step";

/** What this visitor entered in the public calculator, if anything. */
function calculatorDraft(): { draft: CalcDraft; ledger: LedgerCarryOver } | null {
  const stored = parseDraft(readStoredValue(CALC_STORAGE_KEY));
  if (!stored) return null;
  const draft = stored.decimal ? stored : { ...stored, decimal: decimalMarkFor(navigator.language) };
  return draftIsEmpty(draft) ? null : { draft, ledger: draftToLedger(draft) };
}

/** The step to resume at: the trust note first, then wherever setup was left. */
function resumeStep(trusted: boolean): number {
  if (!trusted) return 0;
  const n = parseInt(readStoredValue(STEP_KEY) ?? "", 10);
  return n >= 1 && n < STEPS.length ? n : 1;
}

export default function BeginWizard(props: { name: string; settings: Settings }) {
  // The saved step lives in this browser, so mount once hydrated with it as
  // the initial state.
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <Wizard {...props} />;
}

function Wizard({
  name,
  settings,
}: {
  name: string;
  settings: Settings;
}) {
  const router = useRouter();
  const [step, setStep] = useState(() => resumeStep(Boolean(settings.trustedAckAt)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Starter placeholders are not real prices, so the fields start empty, or
  // with what the visitor already used in the public calculator.
  const starter = metalsLookLikeDefaults(settings.goldPricePerGram, settings.silverPricePerGram);
  const [carry] = useState(calculatorDraft);
  const fromCalc = starter ? carry?.draft : undefined;
  // A new ledger starts in the visitor's own money: what they chose on the
  // public pages, or their browser's region, never a fixed default.
  const [currency, setCurrency] = useState(
    fromCalc?.currency ||
      (starter ? readStoredValue(VISITOR_CURRENCY_KEY) || currencyForLocale(navigator.language) : settings.currency) ||
      "USD",
  );
  const [nisabStandard, setNisabStandard] = useState(fromCalc?.standard ?? settings.nisabStandard);
  const [calendarBasis, setCalendarBasis] = useState(fromCalc?.basis ?? settings.calendarBasis);
  const [madhhab, setMadhhab] = useState<Madhhab>(parseMadhhab(settings.madhhab));
  const [gold, setGold] = useState(
    starter ? (carry?.ledger.prices.goldPricePerGram ?? 0) : settings.goldPricePerGram,
  );
  const [silver, setSilver] = useState(
    starter ? (carry?.ledger.prices.silverPricePerGram ?? 0) : settings.silverPricePerGram,
  );
  // What the visitor kept in My zakat: their zakat day starts the hawl, and
  // what they noted giving comes along as zakat records.
  const [mine] = useState(() => parseMy(readStoredValue(MY_KEY)));
  const zakatDayStart = mine.zakatDay ? lastZakatDay(mine.zakatDay, new Date()).toISOString().slice(0, 10) : "";
  const [hawlStartDate, setHawlStartDate] = useState(settings.hawlStartDate ?? zakatDayStart);
  const [trustedAckAt, setTrustedAckAt] = useState(settings.trustedAckAt);
  const [lookingUp, setLookingUp] = useState(false);
  const [priceHint, setPriceHint] = useState<string | null>(null);

  function go(n: number) {
    setStep(n);
    setStoredValue(STEP_KEY, String(n));
  }

  const [assetLabel, setAssetLabel] = useState("");
  const [assetAmount, setAssetAmount] = useState("");
  const [assetCategory, setAssetCategory] = useState("bank");
  // Set once the first holding is saved, so retrying a failed finish does
  // not add it twice. The calculator's holdings and debts are tracked apart
  // for the same reason: a retry sends only what has not landed yet.
  const [assetSaved, setAssetSaved] = useState(false);
  const [carriedAssets, setCarriedAssets] = useState(false);
  const [carriedDebts, setCarriedDebts] = useState(0);
  const [carriedPayments, setCarriedPayments] = useState(0);

  async function saveSettings(patch: Record<string, unknown>) {
    const body = {
      currency,
      nisabStandard,
      calendarBasis,
      // Until prices are entered, resend the stored ones (the API needs both).
      goldPricePerGram: gold || settings.goldPricePerGram,
      silverPricePerGram: silver || settings.silverPricePerGram,
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
    // Fill only what is still empty, so a price typed meanwhile is kept.
    setGold((g) => (g > 0 ? g : data.goldPricePerGram));
    setSilver((v) => (v > 0 ? v : data.silverPricePerGram));
    setPriceHint(`Today’s prices, from ${data.source}. Change them if your jeweller says otherwise.`);
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
      // Nobody knows the price of a gram of gold: look it up as the step opens.
      if (!(gold > 0) && !(silver > 0)) void suggestPrices();
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
    if (metalsLookLikeDefaults(gold, silver)) {
      // The starter figures are placeholders, far from any real market price;
      // nisab built on them would be wrong.
      setError("Enter today’s prices per gram, or tap Suggest, before continuing.");
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

  async function finish(withAsset: boolean | "calculator") {
    setBusy(true);
    setError(null);
    try {
      if (withAsset === "calculator" && carry && !assetSaved) {
        // Prices are saved first, so weighed metal is valued at the same rate.
        await saveSettings({});
        if (carry.ledger.assets.length > 0 && !carriedAssets) {
          const res = await sendJson(
            "/api/assets/import",
            "POST",
            { rows: carry.ledger.assets },
            "Could not bring in your holdings",
          );
          if (!res.ok) throw new Error(res.error);
          setCarriedAssets(true);
        }
        for (const [i, debt] of carry.ledger.liabilities.entries()) {
          if (i < carriedDebts) continue;
          const res = await sendJson("/api/liabilities", "POST", debt, "Could not add your debts");
          if (!res.ok) throw new Error(res.error);
          setCarriedDebts(i + 1);
        }
        for (const [i, p] of mine.payments.entries()) {
          if (i < carriedPayments) continue;
          const res = await sendJson(
            "/api/giving",
            "POST",
            { amount: p.amount, type: "zakat", recipient: p.to || null, date: p.day },
            "Could not bring in what you have given",
          );
          if (!res.ok) throw new Error(res.error);
          setCarriedPayments(i + 1);
        }
        // They live in the ledger now; the zakat day and the record stay on the phone.
        if (mine.payments.length) {
          setStoredValue(MY_KEY, JSON.stringify({ ...parseMy(readStoredValue(MY_KEY)), payments: [] }));
        }
        setAssetSaved(true);
        setStoredValue(CALC_STORAGE_KEY, null);
      } else if (withAsset === true && !assetSaved) {
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
      setStoredValue(STEP_KEY, null);
      router.push("/dashboard?welcome=1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish setup");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="label text-brassDeep">Begin</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">
          {name}, let’s set up your ledger
        </h1>
        <p className="mt-2 text-sm text-sage">
          Five short steps. You can change any of it later.
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
                  : "text-sage")
            }
          >
            {i + 1}. {label}
            {i < STEPS.length - 1 ? <span className="mx-2 text-sage">/</span> : null}
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
          <h2 className="font-serif text-xl text-ink">Before we start</h2>
          <p className="text-base leading-relaxed text-sage">
            Mizan adds up the figures you give it. It is a help, not a fatwa. Where scholars differ, such as on
            jewellery you wear, you choose, and you can change it later. For your own situation, ask someone of
            knowledge you trust.
          </p>
          <p className="text-sm leading-relaxed text-sage">
            Read{" "}
            <Link href="/method" className="text-pine hover:underline" target="_blank">
              how it works
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
          <h2 className="font-serif text-xl text-ink">Your money</h2>
          <div className="max-w-xs">
            <CurrencySelect value={currency} onChange={setCurrency} id="currency" label="The money you count in" />
          </div>
          {/* Set to what most people use; open only to follow a different view. */}
          <details className="card p-4">
            <summary className="cursor-pointer text-base font-medium text-ink">
              How zakat is counted
              <span className="block text-sm font-normal text-sage">Most people leave these as they are.</span>
            </summary>
            <div className="mt-4 space-y-5">
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
            </div>
          </details>
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
          <h2 className="font-serif text-xl text-ink">Gold and silver prices</h2>
          <p className="text-base text-sage">
            The nisab is a weight of gold or silver, so Mizan needs today’s price of a gram in {currency}. They are
            filled in for you; change them only if your jeweller says otherwise.
          </p>
          <button
            type="button"
            className="btn-ghost"
            disabled={lookingUp || currency.length !== 3}
            onClick={suggestPrices}
          >
            {lookingUp ? "Looking up…" : `Look up today’s prices in ${currency}`}
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
                placeholder="e.g. 125.40"
                required
                value={gold || ""}
                onChange={(e) => setGold(parseFloat(e.target.value) || 0)}
              />
              <p className="mt-1 text-xs text-sage">
                Gold nisab ≈{" "}
                <span className="nums text-brassDeep">
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
                placeholder="e.g. 1.55"
                required
                value={silver || ""}
                onChange={(e) => setSilver(parseFloat(e.target.value) || 0)}
              />
              <p className="mt-1 text-xs text-sage">
                Silver nisab ≈{" "}
                <span className="nums text-brassDeep">
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
          <h2 className="font-serif text-xl text-ink">When did your year start?</h2>
          <p className="text-base text-sage">
            The day your savings last reached the nisab: your zakat is due one Islamic year after it. Not sure? Tap
            “Set later”, or pick a day you will keep each year, such as 1 Ramadan.
          </p>
          {mine.zakatDay && hawlStartDate === zakatDayStart ? (
            <p className="border-s-2 border-pine/50 ps-3 text-sm text-ink">
              From My zakat: your zakat day, {mine.zakatDay.day} {HIJRI_MONTHS[mine.zakatDay.month - 1]}, when this
              year began.
            </p>
          ) : null}
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
          <h2 className="font-serif text-xl text-ink">What you have</h2>
          {carry && !assetSaved ? (
            <div className="border border-pine/40 bg-pine/5 px-4 py-4">
              <p className="text-sm font-medium text-ink">From your calculator</p>
              <ul className="mt-2 space-y-1 text-sm">
                {carry.ledger.assets.map((a) => (
                  <li key={a.label} className="flex justify-between gap-3">
                    <span className="text-sage">{a.label}</span>
                    <span className="text-ink nums">
                      {formatMoney(a.amount, carry.ledger.currency)}
                    </span>
                  </li>
                ))}
                {carry.ledger.liabilities.map((l) => (
                  <li key={l.label} className="flex justify-between gap-3">
                    <span className="text-sage">{l.label}</span>
                    <span className="text-danger nums">
                      −{formatMoney(l.amount, carry.ledger.currency)}
                    </span>
                  </li>
                ))}
                {mine.payments.length ? (
                  <li className="flex justify-between gap-3 border-t border-pine/20 pt-1">
                    <span className="text-sage">
                      Zakat already given ({mine.payments.length} {mine.payments.length === 1 ? "payment" : "payments"})
                    </span>
                    <span className="text-pine nums">
                      {formatMoney(paymentsTotal(mine.payments), carry.ledger.currency)}
                    </span>
                  </li>
                ) : null}
              </ul>
              {carry.ledger.currency !== currency ? (
                <p className="mt-2 text-xs text-warn">
                  These were entered in {carry.ledger.currency}; your ledger uses {currency}.
                  Bring them in and correct the figures on the Ledger page.
                </p>
              ) : null}
              <button
                type="button"
                className="btn-primary mt-4"
                disabled={busy}
                onClick={() => finish("calculator")}
              >
                {busy ? "Saving…" : "Bring these in and finish"}
              </button>
            </div>
          ) : null}
          <p className="text-base text-sage">
            {carry && !assetSaved ? "Or add" : "Add"} your savings now, or skip and add them later. You can add
            everything else, such as gold, on the Ledger page.
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
                <option value="gold">Gold coins and bars</option>
                <option value="silver">Silver coins and bars</option>
                <option value="receivables">Money owed to you</option>
                <option value="business_inventory">Goods for sale</option>
                <option value="stocks_longterm">Shares you keep</option>
                <option value="stocks_trading">Shares you trade</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="pension">Pension</option>
                <option value="other">Something else</option>
              </select>
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="alabel">
                What it is
              </label>
              <input
                id="alabel"
                className="field"
                value={assetLabel}
                onChange={(e) => setAssetLabel(e.target.value)}
                placeholder="e.g. My savings account"
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
              Skip for now
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
