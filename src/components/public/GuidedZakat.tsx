"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CALC_FIELDS,
  CALC_STORAGE_KEY,
  FROM_HOME_KEY,
  DEFAULT_PORTION_PERCENT,
  VISITOR_CURRENCY_KEY,
  computeDraft,
  emptyDraft,
  parseAmount,
  type CalcDraft,
  type CalcFieldKey,
  type WeighableKey,
  weightUnitOf,
} from "@/lib/calculator";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "@/lib/nisab";
import { formatMoney, formatPercent } from "@/lib/money";
import { readStoredValue, setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import { MY_KEY, comingZakatDay, parseMy, zakatDayOf } from "@/lib/my-zakat";
import { hawlCalendar } from "@/lib/ics";
import { countStep, track } from "@/lib/analytics";
import { CurrencyOptions } from "@/components/public/VisitorCurrency";
import ShareButton, { type ShareLabels } from "@/components/public/ShareButton";
import ReadAloud from "@/components/ReadAloud";
import EasyCheck from "@/components/EasyCheck";
import { ResultPicture } from "@/components/public/Visuals";
import GoldPicker from "@/components/public/GoldPicker";
import {
  IconBalance,
  IconBank,
  IconCash,
  IconCheckCircle,
  IconChart,
  IconCoins,
  IconGoldBar,
  IconReceipt,
  IconNecklace,
  IconShop,
  IconUsers,
  IconWheat,
  IconYear,
} from "@/components/icons";
import {
  Choice,
  GivenTracker,
  MoneyInput,
  WeightUnitSwitch,
  purityOptionsFor,
  storedOrFresh,
  type CalcMessages,
} from "@/components/ZakatCalculator";
import { LOCALE_INFO, fmt, localePath, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";
import { useSignedIn } from "@/components/useSignedIn";

type GuideMessages = Messages["guide"];
type EasyLabels = Messages["common"]["easy"];

// The currency is not a question: it is guessed from the phone and shown
// above every step, with "Change" beside it.
const STEPS = [
  "have",
  "cash",
  "bank",
  "gold",
  "jewellery",
  "silver",
  "more",
  "debts",
  "nisab",
  "result",
] as const;
type Step = (typeof STEPS)[number];

/** A picture for each question, so it is recognised before it is read. */
const STEP_ICON: Record<Step, (p: { className?: string }) => React.ReactNode> = {
  have: IconCheckCircle,
  cash: IconCash,
  bank: IconBank,
  gold: IconGoldBar,
  jewellery: IconNecklace,
  silver: IconCoins,
  more: IconChart,
  debts: IconReceipt,
  nisab: IconBalance,
  result: IconCheckCircle,
};

/** Labels for the read-aloud button. */
type Speech = { listen: string; stop: string };

/** The kinds of wealth asked about one step each, picked first as pictures. */
const ASSET_STEPS = ["cash", "bank", "gold", "jewellery", "silver", "more"] as const;
type AssetStep = (typeof ASSET_STEPS)[number];
/** The steps that ask for an amount someone may not know. */
type Unsure = AssetStep | "debts";
const isUnsure = (step: string): step is Unsure => step === "debts" || (ASSET_STEPS as readonly string[]).includes(step);
const isAssetStep = (s: Step): s is AssetStep => (ASSET_STEPS as readonly string[]).includes(s);

/**
 * The rest of what someone may have, which other pages answer better (in
 * English so far): picked here too, so the answer can point to them.
 */
type Also = "shop" | "farm" | "family" | "interest" | "missed";
const ALSO: {
  key: Also;
  label: string;
  Icon: (p: { className?: string }) => React.ReactNode;
  href: string;
  next: string;
}[] = [
  { key: "shop", label: "A shop", Icon: IconShop, href: "/shop", next: "Your shop: stock, the till, and money owed to you" },
  { key: "farm", label: "Crops or farm animals", Icon: IconWheat, href: "/farm", next: "Your harvest and animals, counted on their own" },
  { key: "family", label: "My family’s money too", Icon: IconUsers, href: "/family", next: "Each person’s zakat, one at a time" },
  { key: "interest", label: "Interest from a bank", Icon: IconBank, href: "/interest", next: "Bank interest: set it aside and give it away" },
  { key: "missed", label: "Years I did not pay", Icon: IconYear, href: "/missed-years", next: "Catch up on the years you did not pay" },
];

/** The rarer kinds of wealth, asked about together in one step. */
const MORE_FIELDS: CalcFieldKey[] = [
  "receivables",
  "trading",
  "longterm",
  "crypto",
  "business",
  "pension",
  "other",
];

/** The fineness most often worn: 22 karat for jewellery, pure for savings. */
const DEFAULT_PURITY: Record<WeighableKey, string> = {
  gold: "0.999",
  jewellery: "0.916",
  silver: "0.999",
};

/**
 * Zakat one question at a time, each step saying what to count and why, and
 * the choices scholars differ on explained where they come up. The figures
 * are the calculator's own draft, so either can pick up where the other left.
 */
export default function GuidedZakat({
  m,
  calc,
  speech,
  share,
  easy,
  neighbours = false,
  locale,
}: {
  m: GuideMessages;
  calc: CalcMessages;
  speech: Speech;
  share: ShareLabels;
  easy: EasyLabels;
  /** Real needs near you are listed (English for now). */
  neighbours?: boolean;
  locale: Locale;
}) {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Guide
        key="server"
        initial={emptyDraft()}
        live={false}
        m={m}
        calc={calc}
        speech={speech}
        share={share}
        easy={easy}
        neighbours={neighbours}
        locale={locale}
      />
    );
  }
  return (
    <Guide
      key="client"
      initial={storedOrFresh(null)}
      live
      m={m}
      calc={calc}
      speech={speech}
      share={share}
      easy={easy}
      neighbours={neighbours}
      locale={locale}
    />
  );
}

function Guide({
  initial,
  live,
  m,
  calc,
  speech,
  share,
  easy,
  neighbours = false,
  locale,
}: {
  initial: CalcDraft;
  live: boolean;
  m: GuideMessages;
  calc: CalcMessages;
  speech: Speech;
  share: ShareLabels;
  easy: EasyLabels;
  /** Real needs near you are listed (English for now). */
  neighbours?: boolean;
  locale: Locale;
}) {
  const intl = LOCALE_INFO[locale].intl;
  const [draft, setDraft] = useState<CalcDraft>(initial);
  const [index, setIndex] = useState(0);
  const typedPrices = Boolean(initial.goldPrice || initial.silverPrice) && !initial.pricesAsOf;
  const autoFetch = live && !typedPrices;
  const [prices, setPrices] = useState<"idle" | "loading" | "ok" | "error">(
    autoFetch ? "loading" : "idle",
  );
  const requested = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const card = useRef<HTMLElement>(null);
  const moved = useRef(false);
  const outcome = useMemo(() => computeDraft(draft), [draft]);
  // What they said they have; nothing picked asks about everything.
  const [have, setHave] = useState<Set<AssetStep>>(() => new Set(ASSET_STEPS.filter((k) => holds(initial, k))));
  const [also, setAlso] = useState<Set<Also>>(() => new Set());
  const [pickCurrency, setPickCurrency] = useState(false);
  // Amounts they said they were not sure of: kept as guesses, and named in the answer.
  const [guessed, setGuessed] = useState<Set<Unsure>>(() => new Set());
  const [unsureOpen, setUnsureOpen] = useState<Unsure | null>(null);
  // Arrived from the home page's box: its number is already under cash.
  const [fromHome] = useState(() => {
    if (!live) return false;
    try {
      return sessionStorage.getItem(FROM_HOME_KEY) === "1";
    } catch {
      return false;
    }
  });
  // Said once: coming back to the guide later starts as usual.
  useEffect(() => {
    countStep("guide");
    try {
      sessionStorage.removeItem(FROM_HOME_KEY);
    } catch {
      /* nothing kept, nothing to clear */
    }
  }, []);
  const goldPerGram = parseAmount(draft.goldPrice, draft.decimal);
  const silverPerGram = parseAmount(draft.silverPrice, draft.decimal);
  // The nisab question is only a question when today's prices are missing:
  // otherwise silver is used, and the answer offers gold.
  const pricesKnown = goldPerGram > 0 && silverPerGram > 0;
  const steps = STEPS.filter((s) =>
    isAssetStep(s) ? have.size === 0 || have.has(s) : s === "nisab" ? !pricesKnown : true,
  );
  // The list can shrink under the visitor (prices arrive, a picture is
  // untapped), so the place in it is kept in range.
  const at = Math.min(index, steps.length - 1);
  const step: Step = steps[at];
  const c = draft.currency;
  const money = (n: number) => formatMoney(n, c, intl);

  function update(patch: Partial<CalcDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }
  function updateIn<K extends "amounts" | "byWeight" | "grams" | "purity" | "portions">(
    key: K,
    patch: CalcDraft[K],
  ) {
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...patch } }));
  }

  async function loadPrices(currency: string) {
    requested.current = currency;
    const res = await fetch(`/api/metals?currency=${encodeURIComponent(currency)}`).catch(
      () => null,
    );
    const data = (await res?.json().catch(() => null)) as {
      goldPricePerGram?: number;
      silverPricePerGram?: number;
      asOf?: string;
    } | null;
    if (requested.current !== currency) return;
    if (!res?.ok || !data?.goldPricePerGram || !data.silverPricePerGram) {
      setPrices("error");
      return;
    }
    setDraft((d) =>
      d.currency === currency
        ? {
            ...d,
            goldPrice: String(data.goldPricePerGram),
            silverPrice: String(data.silverPricePerGram),
            pricesAsOf: data.asOf ?? new Date().toISOString(),
          }
        : d,
    );
    setPrices("ok");
  }

  // Today's prices, unless the visitor typed their own before.
  useEffect(() => {
    if (autoFetch) void Promise.resolve(initial.currency).then(loadPrices);
    // Only on mount: later fetches follow a currency change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The same draft the calculator keeps, so each picks up the other's figures.
  useEffect(() => {
    if (!live) return;
    try {
      localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* private mode or storage full: the guide still works */
    }
  }, [draft, live]);

  // Each new step is announced by moving focus to its question, and brought
  // to the top of the screen so the question and its buttons are in view
  // rather than the page's introduction.
  useEffect(() => {
    if (!moved.current) return;
    heading.current?.focus({ preventScroll: true });
    card.current?.scrollIntoView({ block: "start" });
  }, [index]);

  const reached = useRef(false);
  useEffect(() => {
    if (step !== "result" || reached.current) return;
    reached.current = true;
    track("Guided");
    countStep("answer");
  }, [step]);

  function go(to: number) {
    moved.current = true;
    setIndex(Math.max(0, Math.min(steps.length - 1, to)));
  }

  function toggle<T>(set: Set<T>, key: T): Set<T> {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  }

  function changeCurrency(currency: string) {
    update({ currency, goldPrice: "", silverPrice: "", pricesAsOf: null });
    setPrices("loading");
    void loadPrices(currency);
    setStoredValue(VISITOR_CURRENCY_KEY, currency);
  }

  function typePrice(patch: Partial<CalcDraft>) {
    requested.current = null;
    setPrices("idle");
    update({ ...patch, pricesAsOf: null });
  }

  /** "I don't have this": clear what this step holds, then move on. */
  function skip() {
    if (step === "cash" || step === "bank") updateIn("amounts", { [step]: "" });
    if (step === "gold" || step === "jewellery" || step === "silver") {
      updateIn("amounts", { [step]: "" });
      updateIn("grams", { [step]: "" });
    }
    if (step === "more") {
      updateIn("amounts", Object.fromEntries(MORE_FIELDS.map((k) => [k, ""])));
    }
    if (step === "debts") update({ debts: "" });
    if (isUnsure(step)) {
      const next = new Set(guessed);
      next.delete(step);
      setGuessed(next);
    }
    go(at + 1);
  }

  const silverNisab = NISAB_SILVER_GRAMS * silverPerGram;
  const goldNisab = NISAB_GOLD_GRAMS * goldPerGram;
  const counted = outcome.lines.reduce((sum, l) => sum + l.amount * l.zakatablePortion, 0);
  const lineValue = (key: CalcFieldKey) =>
    outcome.lines.find((l) => l.key === key)?.amount ?? 0;
  const skippable = ["cash", "bank", "gold", "jewellery", "silver", "more", "debts"].includes(step);
  const total = steps.length - 1;

  function weighable(key: WeighableKey) {
    const byWeight = draft.byWeight[key] ?? !draft.amounts[key];
    const options = purityOptionsFor(key, calc);
    const value = lineValue(key);
    return (
      <div className="mt-5 space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label={calc.fields[key].label}>
          {(
            [
              [true, m.byWeight],
              [false, m.byValue],
            ] as const
          ).map(([weight, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={byWeight === weight}
              onClick={() => updateIn("byWeight", { [key]: weight })}
              className={
                "min-h-[44px] border px-4 text-sm transition " +
                (byWeight === weight
                  ? "border-pine bg-pine/10 font-medium text-pine"
                  : "border-mist bg-paper text-ink hover:border-sage")
              }
            >
              {label}
            </button>
          ))}
        </div>
        {byWeight ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label mb-1.5" htmlFor={`guide-${key}-grams`}>
                {weightUnitOf(draft) === "tola" ? m.tolaWeight : m.grams}
              </label>
              <input
                id={`guide-${key}-grams`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                className="field text-lg nums"
                value={draft.grams[key] ?? ""}
                onChange={(e) => {
                  updateIn("byWeight", { [key]: true });
                  updateIn("grams", { [key]: e.target.value });
                  if (!draft.purity[key]) updateIn("purity", { [key]: DEFAULT_PURITY[key] });
                  // A weight is read in the unit it was typed in, whatever the currency later.
                  if (!draft.weightUnit) update({ weightUnit: weightUnitOf(draft) });
                }}
              />
              <WeightUnitSwitch
                unit={weightUnitOf(draft)}
                onUnit={(unit) => update({ weightUnit: unit })}
                m={calc}
                className="mt-2"
              />
              {key !== "silver" ? <p className="mt-1 text-xs text-sage">{m.tolaHint}</p> : null}
            </div>
            <div>
              <label className="label mb-1.5" htmlFor={`guide-${key}-purity`}>
                {m.karat}
              </label>
              <select
                id={`guide-${key}-purity`}
                className="field"
                value={draft.purity[key] ?? DEFAULT_PURITY[key]}
                onChange={(e) => updateIn("purity", { [key]: e.target.value })}
              >
                {options.map((o) => (
                  <option key={o.purity} value={String(o.purity)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {key !== "silver" ? (
              <div className="sm:col-span-2">
                <GoldPicker
                  m={m.picker}
                  unit={weightUnitOf(draft)}
                  unitLabel={weightUnitOf(draft) === "tola" ? calc.tolaUnit : calc.gramUnit}
                  onUse={(weight) => {
                    updateIn("byWeight", { [key]: true });
                    updateIn("grams", { [key]: weight });
                    if (!draft.purity[key]) updateIn("purity", { [key]: DEFAULT_PURITY[key] });
                    if (!draft.weightUnit) update({ weightUnit: weightUnitOf(draft) });
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="max-w-xs">
            <MoneyInput
              id={`guide-${key}`}
              label={m.value}
              currency={c}
              intl={intl}
              decimal={draft.decimal}
              value={draft.amounts[key] ?? ""}
              onChange={(v) => {
                updateIn("byWeight", { [key]: false });
                updateIn("amounts", { [key]: v });
              }}
            />
          </div>
        )}
        {byWeight && value > 0 ? (
          <p className="text-sm text-ink" aria-live="polite">
            {fmt(m.worth, { amount: money(value) })}
          </p>
        ) : null}
      </div>
    );
  }

  let title: string;
  let body: ReactNode = null;
  let difference: string | null = null;
  let fields: ReactNode = null;

  switch (step) {
    case "have":
      title = m.have.title;
      body = fromHome && draft.amounts.cash
        ? fmt(m.have.fromHome, { amount: money(parseAmount(draft.amounts.cash, draft.decimal)) })
        : fmt(m.have.body, { next: m.next });
      fields = (
        <>
          <p className="mt-3 border-s-2 border-brass ps-3 text-sm text-ink">{m.have.yours}</p>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ASSET_STEPS.map((key) => (
              <PickTile
                key={key}
                on={have.has(key)}
                label={key === "more" ? m.have.more : calc.fields[key].label}
                Icon={STEP_ICON[key]}
                onClick={() => setHave((h) => toggle(h, key))}
              />
            ))}
            {/* The pages these lead to are in English only so far. */}
            {locale === "en"
              ? ALSO.map(({ key, label, Icon }) => (
                  <PickTile
                    key={key}
                    on={also.has(key)}
                    label={label}
                    Icon={Icon}
                    onClick={() => setAlso((a) => toggle(a, key))}
                  />
                ))
              : null}
          </ul>
        </>
      );
      break;
    case "cash":
    case "bank":
      title = m.steps[step].title;
      body = m.steps[step].body;
      difference = step === "bank" ? m.steps.bank.difference : null;
      fields = (
        <div className="mt-5 max-w-xs">
          <MoneyInput
            id={`guide-${step}`}
            label={m.amount}
            currency={c}
            intl={intl}
            decimal={draft.decimal}
            value={draft.amounts[step] ?? ""}
            onChange={(v) => updateIn("amounts", { [step]: v })}
          />
        </div>
      );
      break;
    case "gold":
    case "silver":
      title = m.steps[step].title;
      body = m.steps[step].body;
      difference = step === "gold" ? m.steps.gold.difference : null;
      fields = weighable(step);
      break;
    case "jewellery":
      title = m.steps.jewellery.title;
      body = m.steps.jewellery.body;
      difference = m.steps.jewellery.difference;
      fields = (
        <>
          {weighable("jewellery")}
          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-ink">{m.steps.jewellery.question}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Choice
                name="guide-jewellery"
                checked={draft.jewelleryCounted}
                onChange={() => update({ jewelleryCounted: true })}
                title={calc.jewelleryYes}
                detail=""
              />
              <Choice
                name="guide-jewellery"
                checked={!draft.jewelleryCounted}
                onChange={() => update({ jewelleryCounted: false })}
                title={calc.jewelleryNo}
                detail=""
              />
            </div>
          </fieldset>
        </>
      );
      break;
    case "more":
      title = m.steps.more.title;
      body = m.steps.more.body;
      difference = m.steps.more.difference;
      fields = <MoreKinds draft={draft} calc={calc} currency={c} intl={intl} updateIn={updateIn} />;
      break;
    case "debts":
      title = m.steps.debts.title;
      body = m.steps.debts.body;
      difference = m.steps.debts.difference;
      fields = (
        <div className="mt-5 max-w-xs">
          <MoneyInput
            id="guide-debts"
            label={calc.debtsDueNow}
            currency={c}
            intl={intl}
            decimal={draft.decimal}
            value={draft.debts}
            onChange={(v) => update({ debts: v })}
          />
        </div>
      );
      break;
    case "nisab":
      title = m.steps.nisab.title;
      body = m.steps.nisab.body;
      difference = m.steps.nisab.difference;
      fields = (
        <>
          {!(silverPerGram > 0) || !(goldPerGram > 0) ? (
            <div className="mt-5">
              <p className="text-sm text-ink">{m.steps.nisab.prices}</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <MoneyInput
                  id="guide-gold-price"
                  label={calc.goldPerGram}
                  currency={c}
                  value={draft.goldPrice}
                  onChange={(v) => typePrice({ goldPrice: v })}
                />
                <MoneyInput
                  id="guide-silver-price"
                  label={calc.silverPerGram}
                  currency={c}
                  value={draft.silverPrice}
                  onChange={(v) => typePrice({ silverPrice: v })}
                />
              </div>
            </div>
          ) : null}
          <fieldset className="mt-5">
            <legend className="sr-only">{calc.nisabStandard}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice
                name="guide-standard"
                checked={draft.standard === "silver"}
                onChange={() => update({ standard: "silver" })}
                title={calc.silverTitle}
                detail={
                  silverNisab > 0
                    ? fmt(calc.silverDetailWithValue, { amount: money(silverNisab) })
                    : calc.silverDetail
                }
              />
              <Choice
                name="guide-standard"
                checked={draft.standard === "gold"}
                onChange={() => update({ standard: "gold" })}
                title={calc.goldTitle}
                detail={goldNisab > 0 ? money(goldNisab) : calc.goldDetail}
              />
            </div>
          </fieldset>
        </>
      );
      break;
    case "result":
      title = outcome.needsPrices
        ? draft.standard === "gold"
          ? calc.needsGoldPrice
          : calc.needsSilverPrice
        : outcome.result.isDue
          ? fmt(m.result.due, { amount: money(outcome.result.zakatDue) })
          : m.result.none;
      fields = outcome.needsPrices ? null : (
        <Result
          also={locale === "en" ? also : null}
          onStandard={(standard) => update({ standard })}
          m={m}
          calc={calc}
          locale={locale}
          draft={draft}
          counted={counted}
          outcome={outcome}
          money={money}
          onChange={() => go(1)}
          onGiven={(v) => update({ given: v })}
          share={share}
          easy={easy}
          neighbours={neighbours}
          guessed={[...guessed].map((k) =>
            k === "more" ? m.have.more : k === "debts" ? calc.debtsDueNow : calc.fields[k].label,
          )}
        />
      );
      break;
  }

  const Icon = STEP_ICON[step];
  // What "Listen" reads: the question and why it is asked, or the answer and what to do.
  const spoken =
    step === "result"
      ? [title, ...(outcome.result.isDue && !outcome.needsPrices ? calc.nextSteps : [])].join(". ")
      : [title, typeof body === "string" ? body : ""].filter(Boolean).join(". ");

  return (
    <section ref={card} aria-labelledby="guide-step" className="card scroll-mt-20 p-5 sm:p-8">
      {step !== "result" ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <p className="sr-only">{fmt(m.stepOf, { n: at + 1, total })}</p>
            {/* Dots, not "1 of 9": where they are, without counting what is left. */}
            <ol className="flex gap-1.5" aria-hidden>
              {Array.from({ length: total }, (_, i) => (
                <li key={i} className={"h-2 w-2 rounded-full " + (i <= at ? "bg-pine" : "bg-mist")} />
              ))}
            </ol>
            <p className="text-sm text-sage">
              {fmt(m.amountsIn, { currency: c })} ·{" "}
              <button
                id="guide-change-currency"
                type="button"
                className="inline-flex min-h-[44px] items-center text-pine underline underline-offset-2"
                aria-expanded={pickCurrency}
                onClick={() => setPickCurrency((p) => !p)}
              >
                {m.changeCurrency}
              </button>
            </p>
          </div>
          {pickCurrency ? (
            <div className="mt-2 sm:max-w-sm">
              <label className="sr-only" htmlFor="guide-currency">
                {calc.yourCurrency}
              </label>
              <select
                id="guide-currency"
                className="field text-base"
                value={c}
                onChange={(e) => {
                  changeCurrency(e.target.value);
                  setPickCurrency(false);
                }}
              >
                <CurrencyOptions value={c} locale={locale} />
              </select>
            </div>
          ) : null}
          {/* Without today's prices, the minimum is asked for before the answer. */}
          {prices === "error" && at === 0 ? (
            <p className="mt-2 text-sm text-sage" role="status">
              {m.steps.currency.unavailable}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={"flex items-start gap-4 " + (step === "result" ? "" : "mt-6")}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine"
          aria-hidden
        >
          <Icon className="h-7 w-7" />
        </span>
        <h2
          id="guide-step"
          ref={heading}
          tabIndex={-1}
          className={
            "min-w-0 flex-1 pt-1 font-serif leading-snug text-ink outline-none " +
            (step === "result" ? "text-3xl text-pine sm:text-4xl" : "text-2xl sm:text-3xl")
          }
        >
          {title}
        </h2>
        <ReadAloud className="mt-1" text={spoken} lang={locale} listen={speech.listen} stop={speech.stop} />
      </div>
      {body ? <p className="mt-3 text-base leading-relaxed text-sage">{body}</p> : null}
      {difference ? (
        <details className="mt-4 border-s-2 border-brass/60 ps-3">
          <summary className="cursor-pointer text-sm font-medium text-pine">{m.difference}</summary>
          <p className="mt-2 text-base leading-relaxed text-sage">{difference}</p>
        </details>
      ) : null}

      {fields}

      {/* Not knowing an amount is common: a tip for this kind of wealth, and the
          amount kept as a guess, named again in the answer. */}
      {isUnsure(step) ? (
        unsureOpen === step || guessed.has(step) ? (
          <div className="mt-5 space-y-2 border-s-4 border-brass bg-brass/5 px-4 py-3" role="note">
            <p className="text-base leading-relaxed text-ink">{m.unsure[step]}</p>
            <p className="text-base leading-relaxed text-sage">{m.guess.tip}</p>
            <p className="flex flex-wrap items-center gap-x-3 text-base">
              <span className="font-medium text-brassDeep">✓ {m.guess.marked}</span>
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center text-pine underline-offset-2 hover:underline"
                onClick={() => {
                  const next = new Set(guessed);
                  next.delete(step);
                  setGuessed(next);
                  setUnsureOpen(null);
                }}
              >
                {m.guess.undo}
              </button>
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-base font-medium text-pine underline-offset-2 hover:underline"
            onClick={() => {
              setGuessed(new Set(guessed).add(step));
              setUnsureOpen(step);
            }}
          >
            <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-pine text-sm">
              ?
            </span>
            {m.notSure}
          </button>
        )
      ) : null}

      {/* The answer has its own "Change my answers"; a Back under it as well
          would be one more button that does nearly the same thing. */}
      {step === "result" ? null : (
        <div className="mt-8 flex flex-col gap-2 border-t border-mist pt-5 sm:flex-row sm:items-center sm:gap-3">
          {/* On a phone, Next is full width and comes first, under the thumb. */}
          <button
            type="button"
            className="btn-primary w-full px-6 py-3 text-base sm:order-2 sm:w-auto"
            onClick={() => go(at + 1)}
          >
            {steps[at + 1] === "result" ? m.seeResult : m.next}
          </button>
          {skippable ? (
            <button
              type="button"
              className="min-h-[44px] text-base text-pine underline-offset-2 hover:underline sm:order-3"
              onClick={skip}
            >
              {m.skip}
            </button>
          ) : null}
          {at > 0 ? (
            <button type="button" className="btn-ghost px-5 sm:order-1" onClick={() => go(at - 1)}>
              {m.back}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** Whether a draft already holds something for this kind of wealth. */
function holds(draft: CalcDraft, key: AssetStep): boolean {
  if (key === "more") return MORE_FIELDS.some((k) => Boolean(draft.amounts[k]));
  if (key === "cash" || key === "bank") return Boolean(draft.amounts[key]);
  return Boolean(draft.amounts[key] || draft.grams[key]);
}

function PickTile({
  on,
  label,
  Icon,
  onClick,
}: {
  on: boolean;
  label: string;
  Icon: (p: { className?: string }) => React.ReactNode;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={on}
        onClick={onClick}
        className={
          "relative flex h-full min-h-[92px] w-full flex-col items-center justify-center gap-2 border-2 px-2 py-3 text-center transition " +
          (on ? "border-pine bg-pine/10" : "border-mist bg-surface hover:border-sage")
        }
      >
        <Icon className={"h-8 w-8 " + (on ? "text-pine" : "text-sage")} />
        <span className="text-sm font-medium leading-snug text-ink">{label}</span>
        {on ? (
          <span className="absolute end-1.5 top-1.5 text-pine" aria-hidden>
            <IconCheckCircle className="h-5 w-5" />
          </span>
        ) : null}
      </button>
    </li>
  );
}

function MoreKinds({
  draft,
  calc,
  currency,
  intl,
  updateIn,
}: {
  draft: CalcDraft;
  calc: CalcMessages;
  currency: string;
  intl: string;
  updateIn: <K extends "amounts" | "portions">(key: K, patch: CalcDraft[K]) => void;
}) {
  const [ticked, setTicked] = useState<Set<CalcFieldKey>>(
    () => new Set(MORE_FIELDS.filter((k) => draft.amounts[k])),
  );
  return (
    <ul className="mt-5 divide-y divide-mist border-y border-mist">
      {MORE_FIELDS.map((key) => {
        const field = CALC_FIELDS.find((f) => f.key === key)!;
        const on = ticked.has(key);
        return (
          <li key={key} className="py-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 accent-[rgb(var(--c-pine))]"
                checked={on}
                onChange={(e) => {
                  const next = new Set(ticked);
                  if (e.target.checked) next.add(key);
                  else {
                    next.delete(key);
                    updateIn("amounts", { [key]: "" });
                  }
                  setTicked(next);
                }}
              />
              <span>
                <span className="block text-base text-ink">{calc.fields[key].label}</span>
                <span className="block text-xs leading-relaxed text-sage">
                  {calc.fields[key].hint}
                </span>
              </span>
            </label>
            {on ? (
              <div className="mt-3 grid gap-3 ps-8 sm:grid-cols-[14rem_auto] sm:items-end">
                <MoneyInput
                  id={`guide-${key}`}
                  label={calc.fields[key].label}
                  currency={currency}
                  intl={intl}
                  decimal={draft.decimal}
                  value={draft.amounts[key] ?? ""}
                  onChange={(v) => updateIn("amounts", { [key]: v })}
                />
                {field.portion ? (
                  <div className="flex items-center gap-2 text-xs text-sage">
                    <label htmlFor={`guide-${key}-portion`}>{calc.countedShare}</label>
                    <div className="relative w-20">
                      <input
                        id={`guide-${key}-portion`}
                        type="text"
                        inputMode="decimal"
                        className="field min-h-0 py-1 pe-6 text-sm nums"
                        placeholder={DEFAULT_PORTION_PERCENT[field.portion]}
                        value={draft.portions[field.portion] ?? ""}
                        onChange={(e) =>
                          updateIn("portions", { [field.portion!]: e.target.value })
                        }
                      />
                      <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center">
                        %
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function Result({
  m,
  calc,
  locale,
  draft,
  counted,
  outcome,
  money,
  onChange,
  onGiven,
  onStandard,
  also,
  share,
  easy,
  neighbours,
  guessed,
}: {
  m: GuideMessages;
  calc: CalcMessages;
  locale: Locale;
  draft: CalcDraft;
  counted: number;
  outcome: ReturnType<typeof computeDraft>;
  money: (n: number) => string;
  onChange: () => void;
  onGiven: (v: string) => void;
  onStandard: (standard: "silver" | "gold") => void;
  /** What else they said they have, where those pages exist (English). */
  also: Set<Also> | null;
  share: ShareLabels;
  easy: EasyLabels;
  neighbours: boolean;
  /** What they marked as a guess, by name. */
  guessed: string[];
}) {
  const signedIn = useSignedIn();
  const myRaw = useStoredValue(MY_KEY);
  const intl = LOCALE_INFO[locale].intl;
  const { result } = outcome;
  const rate = formatPercent(result.rate, draft.basis === "solar" ? 3 : 1, intl);
  const silverNisab = NISAB_SILVER_GRAMS * parseAmount(draft.silverPrice, draft.decimal);
  const goldNisab = NISAB_GOLD_GRAMS * parseAmount(draft.goldPrice, draft.decimal);
  // The guide's reminder and My zakat keep one zakat day: the one already
  // chosen, or today, chosen by asking to be reminded.
  const zakatDay = parseMy(myRaw).zakatDay;
  const nextYear = comingZakatDay(zakatDay ?? zakatDayOf(new Date()), new Date());
  const nextYearText = nextYear.toLocaleDateString(intl, { dateStyle: "long", timeZone: "UTC" });
  const alsoNext = also ? ALSO.filter((a) => also.has(a.key)) : [];

  function remind() {
    if (!zakatDay) {
      setStoredValue(MY_KEY, JSON.stringify({ ...parseMy(readStoredValue(MY_KEY)), zakatDay: zakatDayOf(new Date()) }));
    }
    const ics = hawlCalendar({
      dueDay: nextYear.toISOString().slice(0, 10),
      calendarLabel: "lunar",
      summary: m.result.reminderSummary,
      description: `${m.result.reminderBody} ${new URL(localePath(locale, "/guide"), window.location.origin)}`,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "zakat-reminder.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking at once can cancel the download in Safari and Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    track("Reminder", { via: "calendar" });
    countStep("reminder");
  }

  const verdict = result.isDue
    ? fmt(m.result.above, {
        nisab: money(result.nisab),
        rate,
        net: money(result.netZakatable),
        zakat: money(result.zakatDue),
      })
    : fmt(m.result.below, { nisab: money(result.nisab) });
  const working = [
    fmt(m.result.total, { total: money(counted) }),
    outcome.debts > 0
      ? fmt(m.result.debts, { debts: money(outcome.debts), net: money(result.netZakatable) })
      : null,
  ].filter((s): s is string => s !== null);

  return (
    <div className="mt-4 space-y-6">
      {/* The answer as a picture, then in one sentence; the working is a tap away. */}
      <ResultPicture
        counted={counted}
        debts={outcome.debts}
        net={result.netZakatable}
        nisab={result.nisab}
        due={result.isDue}
        money={money}
        summary={[...working, verdict].join(" ")}
        labels={{
          own: calc.ownTitle,
          debts: calc.debtsDueNow,
          net: calc.netWealth,
          nisab: draft.standard === "gold" ? calc.nisabGold : calc.nisabSilver,
        }}
      />
      <p className="text-base leading-relaxed text-ink">{verdict}</p>
      {guessed.length ? (
        <p className="border-s-4 border-brass bg-brass/5 px-4 py-3 text-base leading-relaxed text-ink">
          {fmt(m.result.guessed, { items: guessed.join(", ") })}
        </p>
      ) : null}

      {result.isDue ? (
        <div>
          <h3 className="font-serif text-xl text-ink">{m.result.doTitle}</h3>
          {/* The last step, counting again in a year, is the reminder below. */}
          <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-base leading-relaxed text-sage">
            {calc.nextSteps.slice(0, 2).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {/* My zakat and the giving guide are in English only so far. */}
          {locale === "en" ? (
            <div className="mt-3 flex flex-col gap-1.5">
              <Link href="/my" className="text-base font-medium text-pine hover:underline">
                Saved in My zakat: note what you give, and get a reminder every year →
              </Link>
              {neighbours ? (
                <Link href="/neighbours?zakat=1" className="text-base font-medium text-pine hover:underline">
                  Give it to a family near you, checked by a mosque →
                </Link>
              ) : null}
              <Link href="/give" className="text-base font-medium text-pine hover:underline">
                Where to give it, and how to choose a charity →
              </Link>
            </div>
          ) : null}
          <GivenTracker
            id="guide-given"
            due={result.zakatDue}
            value={draft.given}
            decimal={draft.decimal}
            currency={draft.currency}
            money={money}
            onChange={onGiven}
            m={calc}
            intl={intl}
          />
        </div>
      ) : (
        <p className="text-base leading-relaxed text-sage">{calc.belowNext}</p>
      )}

      {alsoNext.length ? (
        <div>
          <h3 className="font-serif text-xl text-ink">Also for you</h3>
          <ul className="mt-2 space-y-1.5">
            {alsoNext.map((a) => (
              <li key={a.key}>
                <Link href={a.href} className="text-base font-medium text-pine hover:underline">
                  {a.next} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-mist bg-paper/60 p-4">
          <button type="button" className="btn-primary w-full" onClick={remind}>
            {m.result.reminder}
          </button>
          <p className="mt-2 text-xs text-sage">
            {fmt(zakatDay ? m.result.reminderHintDay : m.result.reminderHint, { date: nextYearText })}
          </p>
        </div>
        {signedIn ? (
          <div className="border border-mist bg-paper/60 p-4">
            <Link href="/assets#from-phone" className="btn-primary w-full">
              {calc.keepMineCta}
            </Link>
            <p className="mt-2 text-xs text-sage">{calc.keepMineBody}</p>
          </div>
        ) : null}
      </div>

      <details className="border-t border-mist pt-4">
        <summary className="cursor-pointer text-base font-medium text-pine">{m.howWorked}</summary>
        <div className="mt-3 space-y-4">
          <div className="space-y-2 text-base leading-relaxed text-ink">
            {working.map((s) => (
              <p key={s}>{s}</p>
            ))}
            <p className="text-sm text-sage">{m.result.hawl}</p>
          </div>
          {/* The calculator: every question on one page, for anyone who wants it. */}
          <Link
            href={localePath(locale, "/calculator")}
            className="inline-flex min-h-[44px] items-center text-base font-medium text-pine hover:underline"
          >
            {m.onePage} →
          </Link>
          {outcome.lines.length > 0 ? (
            <dl className="space-y-1.5 border-y border-mist py-4 text-sm">
              {outcome.lines.map((line) => (
                <div key={line.key} className="flex justify-between gap-3">
                  <dt className="text-sage">
                    {calc.fields[line.key].label}
                    {line.zakatablePortion === 0 && line.key === "jewellery" ? (
                      <span className="block text-xs">{calc.jewelleryNo}</span>
                    ) : line.zakatablePortion < 1 ? (
                      <span className="block text-xs">
                        {fmt(calc.shareOf, {
                          share: formatPercent(line.zakatablePortion, 0, intl),
                          amount: money(line.amount),
                        })}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="text-ink nums">
                    {line.zakatablePortion === 0 ? "—" : money(line.amount * line.zakatablePortion)}
                  </dd>
                </div>
              ))}
              {outcome.debts > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-sage">{calc.debtsDueNow}</dt>
                  <dd className="text-danger nums">−{money(outcome.debts)}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          <fieldset>
            <legend className="text-sm font-medium text-ink">{m.steps.nisab.title}</legend>
            <p className="mt-1 text-sm text-sage">{m.steps.nisab.body}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Choice
                name="guide-result-standard"
                checked={draft.standard === "silver"}
                onChange={() => onStandard("silver")}
                title={calc.silverTitle}
                detail={
                  silverNisab > 0
                    ? fmt(calc.silverDetailWithValue, { amount: money(silverNisab) })
                    : calc.silverDetail
                }
              />
              <Choice
                name="guide-result-standard"
                checked={draft.standard === "gold"}
                onChange={() => onStandard("gold")}
                title={calc.goldTitle}
                detail={goldNisab > 0 ? money(goldNisab) : calc.goldDetail}
              />
            </div>
          </fieldset>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Link href={localePath(locale, "/who-can-receive")} className="text-pine hover:underline">
          {m.result.who}
        </Link>
        <button type="button" className="text-pine hover:underline" onClick={onChange}>
          {m.result.change}
        </button>
        <button type="button" className="text-pine hover:underline" onClick={() => window.print()}>
          {m.result.print}
        </button>
      </div>

      <div className="border-t border-mist pt-4">
        <ShareButton
          label={m.result.share}
          text={m.result.shareText}
          path={localePath(locale, "/guide")}
          labels={share}
        />
      </div>

      <EasyCheck page="guide" locale={locale} m={easy} />
    </div>
  );
}
