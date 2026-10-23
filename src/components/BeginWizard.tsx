"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Settings } from "@/db/schema";
import { categoryForMadhhab, parseMadhhab, type Madhhab } from "@/lib/madhhab";
import { formatMoney } from "@/lib/money";
import { metalsLookLikeDefaults } from "@/lib/giving-window";
import { CurrencySelect } from "@/components/public/VisitorCurrency";
import { sendJson } from "@/lib/client-fetch";
import { readStoredValue, setStoredValue, useHydrated } from "@/lib/client-store";
import { readableDay } from "@/lib/dates";
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
import { IconBank, IconCash, IconCoins, IconGoldBar, IconOwed, IconQuestion } from "@/components/icons";

// Two steps: the zakat day (with the money and today's prices filled in,
// changeable on the same screen), then what you have.
const STEPS = ["Your zakat day", "What you have"] as const;
const STEP_KEY = "mizan-begin-step";

/** What this visitor entered in the public calculator, if anything. */
function calculatorDraft(): { draft: CalcDraft; ledger: LedgerCarryOver } | null {
  const stored = parseDraft(readStoredValue(CALC_STORAGE_KEY));
  if (!stored) return null;
  const draft = stored.decimal ? stored : { ...stored, decimal: decimalMarkFor(navigator.language) };
  return draftIsEmpty(draft) ? null : { draft, ledger: draftToLedger(draft) };
}

/** The step to resume at, if setup was left part-way. */
function resumeStep(): number {
  const n = parseInt(readStoredValue(STEP_KEY) ?? "", 10);
  return n >= 0 && n < STEPS.length ? n : 0;
}

/** The kinds a first holding is picked from, as pictures. */
const FIRST_KINDS = [
  { value: "bank", label: "Money in the bank", Icon: IconBank },
  { value: "cash", label: "Cash at home", Icon: IconCash },
  { value: "gold", label: "Gold coins or bars", Icon: IconGoldBar },
  { value: "silver", label: "Silver", Icon: IconCoins },
  { value: "receivables", label: "Money owed to me", Icon: IconOwed },
  { value: "other", label: "Something else", Icon: IconQuestion },
] as const;

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
  const [step, setStep] = useState(resumeStep);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Starter placeholders are not real prices, so the fields start empty, or
  // with what the visitor already used in the public calculator.
  const starter = metalsLookLikeDefaults(settings.goldPricePerGram, settings.silverPricePerGram);
  const [carry] = useState(calculatorDraft);
  const fromCalc = starter ? carry?.draft : undefined;
  // A new account starts in the visitor's own money: what they chose on the
  // public pages, or their browser's region, never a fixed default.
  const [currency, setCurrency] = useState(
    fromCalc?.currency ||
      (starter ? readStoredValue(VISITOR_CURRENCY_KEY) || currencyForLocale(navigator.language) : settings.currency) ||
      "USD",
  );
  // How zakat is counted keeps what most people use, or what the calculator
  // used; Settings can change it later.
  const nisabStandard = fromCalc?.standard ?? settings.nisabStandard;
  const calendarBasis = fromCalc?.basis ?? settings.calendarBasis;
  const madhhab: Madhhab = parseMadhhab(settings.madhhab);
  const [gold, setGold] = useState(
    starter ? (carry?.ledger.prices.goldPricePerGram ?? 0) : settings.goldPricePerGram,
  );
  const [silver, setSilver] = useState(
    starter ? (carry?.ledger.prices.silverPricePerGram ?? 0) : settings.silverPricePerGram,
  );
  // What the visitor kept in My zakat: their zakat day starts the hawl, and
  // what they noted giving comes along as zakat records. Without one, the
  // year is taken to start on the last 1 Ramadan, the day most people keep.
  const [mine] = useState(() => parseMy(readStoredValue(MY_KEY)));
  const zakatDay = mine.zakatDay ?? { month: 9, day: 1 };
  const zakatDayStart = lastZakatDay(zakatDay, new Date()).toISOString().slice(0, 10);
  const [hawlStartDate, setHawlStartDate] = useState(settings.hawlStartDate ?? zakatDayStart);
  const [pickCurrency, setPickCurrency] = useState(false);
  const [editPrices, setEditPrices] = useState(false);
  const [lookup, setLookup] = useState<"idle" | "loading" | "failed">("idle");
  const pricesKnown = gold > 0 && silver > 0 && !metalsLookLikeDefaults(gold, silver);

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
      trustedAckAt: settings.trustedAckAt,
      setupComplete: false,
      ...patch,
    };
    const res = await sendJson("/api/settings", "PUT", body, "Could not save");
    if (!res.ok) throw new Error(res.error);
  }

  /** Today's prices for `code`, filled in without a question. */
  async function lookUpPrices(code: string) {
    setLookup("loading");
    const res = await fetch(`/api/metals?currency=${encodeURIComponent(code)}`).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) ?? {};
    if (!res?.ok || !(data.goldPricePerGram > 0) || !(data.silverPricePerGram > 0)) {
      setLookup("failed");
      return;
    }
    setGold(data.goldPricePerGram);
    setSilver(data.silverPricePerGram);
    setLookup("idle");
  }

  // Nobody knows the price of a gram of gold: look it up as setup opens.
  useEffect(() => {
    if (!pricesKnown) void Promise.resolve(currency).then(lookUpPrices);
    // Only on opening; a change of money looks them up again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeCurrency(code: string) {
    setCurrency(code);
    setPickCurrency(false);
    setGold(0);
    setSilver(0);
    void lookUpPrices(code);
  }

  /** Step one done: money, prices and the zakat day saved together. */
  async function nextFromYear(date: string) {
    if (!pricesKnown) {
      setEditPrices(true);
      setError("Enter today’s gold and silver prices for a gram, so Mizan knows the minimum (nisab).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveSettings({ hawlStartDate: date || null, trustedAckAt: settings.trustedAckAt ?? new Date().toISOString() });
      go(1);
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
        if (!(amount >= 0)) {
          setError("Enter how much, or tap “Skip for now”.");
          setBusy(false);
          return;
        }
        // A name is optional: the kind they tapped stands in for it.
        const label = assetLabel.trim() || FIRST_KINDS.find((k) => k.value === assetCategory)?.label || "Savings";
        const portion = categoryForMadhhab(assetCategory, madhhab).defaultZakatablePortion;
        const res = await sendJson(
          "/api/assets",
          "POST",
          {
            category: assetCategory,
            label,
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

  const showPriceFields = editPrices || lookup === "failed" || (lookup === "idle" && !pricesKnown);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl text-ink">{name}, let’s set up your account</h1>
        <p className="mt-2 text-base text-sage">Two short steps. You can change any of it later.</p>
      </header>

      <ol className="flex gap-2" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={"h-2 flex-1 rounded-full " + (i <= step ? "bg-pine" : "bg-mist")}
          >
            <span className="sr-only">
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      {error && (
        <p className="text-base text-danger" role="alert">
          {error}
        </p>
      )}

      {step === 0 && (
        <section className="space-y-6">
          <div className="space-y-2 text-base text-sage">
            <p>
              Amounts in <span className="font-medium text-ink">{currency}</span> ·{" "}
              <button
                id="change-currency"
                type="button"
                className="inline-flex min-h-[44px] items-center text-pine underline underline-offset-2"
                aria-expanded={pickCurrency}
                onClick={() => setPickCurrency((p) => !p)}
              >
                Change
              </button>
            </p>
            {pickCurrency ? (
              <div className="max-w-xs">
                <CurrencySelect value={currency} onChange={changeCurrency} id="currency" label="The money you count in" />
              </div>
            ) : null}
            {lookup === "loading" ? (
              <p role="status">Getting today’s gold and silver prices…</p>
            ) : pricesKnown && !editPrices ? (
              <p>
                Today’s prices: gold {formatMoney(gold, currency)}, silver {formatMoney(silver, currency)} a gram ·{" "}
                <button
                  id="change-prices"
                  type="button"
                  className="inline-flex min-h-[44px] items-center text-pine underline underline-offset-2"
                  onClick={() => setEditPrices(true)}
                >
                  Change
                </button>
              </p>
            ) : null}
            {showPriceFields ? (
              <div className="space-y-3">
                {lookup === "failed" ? (
                  <p>We could not get today’s prices. Enter the price of a gram, as your jeweller says.</p>
                ) : null}
                <div className="grid max-w-md gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label mb-1.5" htmlFor="gold">
                      Gold, a gram ({currency})
                    </label>
                    <input
                      id="gold"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      className="field nums"
                      value={gold || ""}
                      onChange={(e) => setGold(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="label mb-1.5" htmlFor="silver">
                      Silver, a gram ({currency})
                    </label>
                    <input
                      id="silver"
                      type="number"
                      inputMode="decimal"
                      step="0.0001"
                      min="0"
                      className="field nums"
                      value={silver || ""}
                      onChange={(e) => setSilver(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-2xl text-ink">When did your zakat year start?</h2>
            <p className="text-base text-sage">
              {mine.zakatDay
                ? `From My zakat: your zakat day, ${mine.zakatDay.day} ${HIJRI_MONTHS[mine.zakatDay.month - 1]}.`
                : "Most people keep 1 Ramadan. It is filled in; change it if yours is different."}
            </p>
            <div className="max-w-xs">
              <label className="label mb-1.5" htmlFor="hawl">
                The day it started
              </label>
              <input
                id="hawl"
                type="date"
                className="field"
                value={hawlStartDate}
                onChange={(e) => setHawlStartDate(e.target.value)}
              />
              {hawlStartDate ? (
                <p className="mt-1 text-sm text-sage">Zakat is due a year later, around {readableDay(nextYear(hawlStartDate))}.</p>
              ) : null}
            </div>
          </div>

          <p className="text-sm text-sage">
            Mizan adds up what you enter. For your own case, ask someone of knowledge you trust.{" "}
            <Link href="/method" className="text-pine hover:underline" target="_blank">
              How it works
            </Link>
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              className="btn-primary w-full py-3 text-base sm:order-2 sm:w-auto"
              disabled={busy || lookup === "loading"}
              onClick={() => void nextFromYear(hawlStartDate)}
            >
              Continue
            </button>
            <button
              type="button"
              className="min-h-[44px] text-base text-pine underline-offset-2 hover:underline sm:order-1"
              disabled={busy || lookup === "loading"}
              onClick={() => {
                setHawlStartDate("");
                void nextFromYear("");
              }}
            >
              I’ll set the day later
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-5">
          <h2 className="font-serif text-2xl text-ink">What do you have?</h2>
          {carry && !assetSaved ? (
            <div className="border border-pine/40 bg-pine/5 px-4 py-4">
              <p className="text-base font-medium text-ink">From your calculator</p>
              <ul className="mt-2 space-y-1 text-sm">
                {carry.ledger.assets.map((a) => (
                  <li key={a.label} className="flex justify-between gap-3">
                    <span className="text-sage">{a.label}</span>
                    <span className="text-ink nums">{formatMoney(a.amount, carry.ledger.currency)}</span>
                  </li>
                ))}
                {carry.ledger.liabilities.map((l) => (
                  <li key={l.label} className="flex justify-between gap-3">
                    <span className="text-sage">{l.label}</span>
                    <span className="text-danger nums">−{formatMoney(l.amount, carry.ledger.currency)}</span>
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
                <p className="mt-2 text-sm text-warn">
                  These were entered in {carry.ledger.currency}; your account uses {currency}. Bring them in, then
                  correct the figures on What I own.
                </p>
              ) : null}
              <button
                type="button"
                className="btn-primary mt-4 w-full sm:w-auto"
                disabled={busy}
                onClick={() => finish("calculator")}
              >
                {busy ? "Saving…" : "Bring these in and finish"}
              </button>
            </div>
          ) : null}
          <p className="text-base text-sage">
            {carry && !assetSaved ? "Or start with one thing." : "Start with one thing."} You can add the rest on
            What I own.
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="What it is">
            {FIRST_KINDS.map(({ value, label, Icon }) => {
              const on = assetCategory === value;
              return (
                <li key={value}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAssetCategory(value)}
                    className={
                      "flex h-full min-h-[84px] w-full flex-col items-center justify-center gap-2 border-2 px-2 py-3 text-center transition " +
                      (on ? "border-pine bg-pine/10" : "border-mist bg-surface hover:border-sage")
                    }
                  >
                    <Icon className={"h-7 w-7 " + (on ? "text-pine" : "text-sage")} />
                    <span className="text-sm font-medium leading-snug text-ink">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label mb-1.5" htmlFor="aamount">
                How much ({currency})
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
                placeholder="0"
              />
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="alabel">
                Name it (optional)
              </label>
              <input
                id="alabel"
                className="field"
                value={assetLabel}
                onChange={(e) => setAssetLabel(e.target.value)}
                placeholder={FIRST_KINDS.find((k) => k.value === assetCategory)?.label}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              className="btn-primary w-full py-3 text-base sm:order-2 sm:w-auto"
              disabled={busy}
              onClick={() => finish(true)}
            >
              {busy ? "Saving…" : "Add and finish"}
            </button>
            <button
              type="button"
              className="btn-ghost sm:order-1"
              disabled={busy}
              onClick={() => finish(false)}
            >
              Skip for now
            </button>
            <button
              type="button"
              className="min-h-[44px] text-base text-pine underline-offset-2 hover:underline sm:order-3"
              onClick={() => go(0)}
            >
              Back
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/** The same calendar day a Gregorian year later, near enough for a hint. */
function nextYear(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  // A lunar year is about 354 days.
  return new Date(d.getTime() + 354 * 86_400_000).toISOString().slice(0, 10);
}
