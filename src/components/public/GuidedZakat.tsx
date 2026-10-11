"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CALC_FIELDS,
  CALC_STORAGE_KEY,
  DEFAULT_PORTION_PERCENT,
  VISITOR_CURRENCY_KEY,
  computeDraft,
  emptyDraft,
  parseAmount,
  type CalcDraft,
  type CalcFieldKey,
  type WeighableKey,
} from "@/lib/calculator";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "@/lib/nisab";
import { formatMoney, formatPercent } from "@/lib/money";
import { setStoredValue, useHydrated } from "@/lib/client-store";
import { hawlDueDate } from "@/lib/hijri";
import { hawlCalendar } from "@/lib/ics";
import { track } from "@/lib/analytics";
import { CurrencyOptions } from "@/components/public/VisitorCurrency";
import ReadAloud from "@/components/ReadAloud";
import {
  IconBalance,
  IconBank,
  IconCash,
  IconCheckCircle,
  IconChart,
  IconCoins,
  IconGlobe,
  IconGoldBar,
  IconReceipt,
  IconRing,
} from "@/components/icons";
import {
  Choice,
  MoneyInput,
  purityOptionsFor,
  storedOrFresh,
  type CalcMessages,
} from "@/components/ZakatCalculator";
import { LOCALE_INFO, fmt, localePath, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

type GuideMessages = Messages["guide"];

const STEPS = [
  "currency",
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
  currency: IconGlobe,
  cash: IconCash,
  bank: IconBank,
  gold: IconGoldBar,
  jewellery: IconRing,
  silver: IconCoins,
  more: IconChart,
  debts: IconReceipt,
  nisab: IconBalance,
  result: IconCheckCircle,
};

/** Labels for the read-aloud button. */
type Speech = { listen: string; stop: string };

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
  locale,
}: {
  m: GuideMessages;
  calc: CalcMessages;
  speech: Speech;
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
  locale,
}: {
  initial: CalcDraft;
  live: boolean;
  m: GuideMessages;
  calc: CalcMessages;
  speech: Speech;
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
  const moved = useRef(false);
  const outcome = useMemo(() => computeDraft(draft), [draft]);
  const step: Step = STEPS[index];
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

  // Each new step is announced by moving focus to its question.
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [index]);

  const reached = useRef(false);
  useEffect(() => {
    if (step !== "result" || reached.current) return;
    reached.current = true;
    track("Guided");
  }, [step]);

  function go(to: number) {
    moved.current = true;
    setIndex(Math.max(0, Math.min(STEPS.length - 1, to)));
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
    go(index + 1);
  }

  const goldPerGram = parseAmount(draft.goldPrice, draft.decimal);
  const silverPerGram = parseAmount(draft.silverPrice, draft.decimal);
  const silverNisab = NISAB_SILVER_GRAMS * silverPerGram;
  const goldNisab = NISAB_GOLD_GRAMS * goldPerGram;
  const counted = outcome.lines.reduce((sum, l) => sum + l.amount * l.zakatablePortion, 0);
  const lineValue = (key: CalcFieldKey) =>
    outcome.lines.find((l) => l.key === key)?.amount ?? 0;
  const skippable = ["cash", "bank", "gold", "jewellery", "silver", "more", "debts"].includes(step);
  const total = STEPS.length - 1;

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
                {m.grams}
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
                }}
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
          </div>
        ) : (
          <div className="max-w-xs">
            <MoneyInput
              id={`guide-${key}`}
              label={m.value}
              currency={c}
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
    case "currency":
      title = m.steps.currency.title;
      body = m.steps.currency.body;
      fields = (
        <div className="mt-5">
          <label className="sr-only" htmlFor="guide-currency">
            {calc.yourCurrency}
          </label>
          <select
            id="guide-currency"
            className="field text-base sm:max-w-sm"
            value={c}
            onChange={(e) => changeCurrency(e.target.value)}
          >
            <CurrencyOptions value={c} locale={locale} />
          </select>
          <p className="mt-4 text-sm leading-relaxed text-ink" aria-live="polite">
            {prices === "loading"
              ? m.steps.currency.loading
              : silverNisab > 0 && goldNisab > 0
                ? fmt(m.steps.currency.nisab, { silver: money(silverNisab), gold: money(goldNisab) })
                : prices === "error"
                  ? m.steps.currency.unavailable
                  : null}
          </p>
        </div>
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
      fields = <MoreKinds draft={draft} calc={calc} currency={c} updateIn={updateIn} />;
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
          m={m}
          calc={calc}
          locale={locale}
          draft={draft}
          counted={counted}
          outcome={outcome}
          money={money}
          onChange={() => go(0)}
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
    <section aria-labelledby="guide-step" className="card p-5 sm:p-8">
      {step !== "result" ? (
        <div>
          <p className="label text-brassDeep">{fmt(m.stepOf, { n: index + 1, total })}</p>
          <div className="mt-2 h-1.5 overflow-hidden bg-mist" aria-hidden>
            <div
              className="h-full bg-pine transition-all duration-300"
              style={{ width: `${Math.round(((index + 1) / total) * 100)}%` }}
            />
          </div>
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
            "pt-1 font-serif leading-snug text-ink outline-none " +
            (step === "result" ? "text-3xl text-pine sm:text-4xl" : "text-2xl sm:text-3xl")
          }
        >
          {title}
        </h2>
      </div>
      {body ? <p className="mt-3 text-base leading-relaxed text-sage">{body}</p> : null}
      <ReadAloud
        className="mt-3"
        text={spoken}
        lang={locale}
        listen={speech.listen}
        stop={speech.stop}
      />
      {difference ? (
        <details className="mt-4 border-s-2 border-brass/60 ps-3">
          <summary className="cursor-pointer text-sm font-medium text-pine">{m.difference}</summary>
          <p className="mt-2 text-base leading-relaxed text-sage">{difference}</p>
        </details>
      ) : null}

      {fields}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-mist pt-5">
        {index > 0 ? (
          <button type="button" className="btn-ghost px-5" onClick={() => go(index - 1)}>
            {m.back}
          </button>
        ) : null}
        {step === "result" ? null : (
          <button
            type="button"
            className="btn-primary px-6 py-3 text-base"
            onClick={() => go(index + 1)}
          >
            {step === "nisab" ? m.seeResult : m.next}
          </button>
        )}
        {skippable ? (
          <button
            type="button"
            className="text-sm text-pine underline-offset-2 hover:underline"
            onClick={skip}
          >
            {m.skip}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function MoreKinds({
  draft,
  calc,
  currency,
  updateIn,
}: {
  draft: CalcDraft;
  calc: CalcMessages;
  currency: string;
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
}: {
  m: GuideMessages;
  calc: CalcMessages;
  locale: Locale;
  draft: CalcDraft;
  counted: number;
  outcome: ReturnType<typeof computeDraft>;
  money: (n: number) => string;
  onChange: () => void;
}) {
  const intl = LOCALE_INFO[locale].intl;
  const { result } = outcome;
  const rate = formatPercent(result.rate, draft.basis === "solar" ? 3 : 1, intl);
  const nextYear = hawlDueDate(new Date());
  const nextYearText = nextYear.toLocaleDateString(intl, { dateStyle: "long", timeZone: "UTC" });

  function remind() {
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
  }

  return (
    <div className="mt-4 space-y-6">
      {/* How the answer was reached, in sentences. */}
      <div className="space-y-2 text-base leading-relaxed text-ink">
        <p>{fmt(m.result.total, { total: money(counted) })}</p>
        {outcome.debts > 0 ? (
          <p>{fmt(m.result.debts, { debts: money(outcome.debts), net: money(result.netZakatable) })}</p>
        ) : null}
        <p>
          {result.isDue
            ? fmt(m.result.above, {
                nisab: money(result.nisab),
                rate,
                net: money(result.netZakatable),
                zakat: money(result.zakatDue),
              })
            : fmt(m.result.below, { nisab: money(result.nisab) })}
        </p>
        <p className="text-sm text-sage">{m.result.hawl}</p>
      </div>

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

      <div>
        <h3 className="font-serif text-xl text-ink">{m.result.doTitle}</h3>
        {result.isDue ? (
          <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-base leading-relaxed text-sage">
            {calc.nextSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-base leading-relaxed text-sage">{calc.belowNext}</p>
        )}
        <p className="mt-2 text-sm">
          <Link href={localePath(locale, "/who-can-receive")} className="text-pine hover:underline">
            {m.result.who}
          </Link>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-mist bg-paper/60 p-4">
          <button type="button" className="btn-primary w-full" onClick={remind}>
            {m.result.reminder}
          </button>
          <p className="mt-2 text-xs text-sage">
            {fmt(m.result.reminderHint, { date: nextYearText })}
          </p>
        </div>
        <div className="border border-mist bg-paper/60 p-4">
          <Link href="/register?from=calculator" className="btn-primary w-full">
            {m.result.ledger}
          </Link>
          <p className="mt-2 text-xs text-sage">{m.result.ledgerHint}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <button type="button" className="text-pine hover:underline" onClick={() => window.print()}>
          {m.result.print}
        </button>
        <Link href={localePath(locale, "/calculator")} className="text-pine hover:underline">
          {m.result.calculator}
        </Link>
        <button type="button" className="text-pine hover:underline" onClick={onChange}>
          {m.result.change}
        </button>
      </div>
    </div>
  );
}
