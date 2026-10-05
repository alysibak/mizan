"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CALC_CURRENCIES,
  CALC_FIELDS,
  CALC_STORAGE_KEY,
  DEFAULT_PORTION_PERCENT,
  computeDraft,
  currencyForLocale,
  decimalMarkFor,
  emptyDraft,
  parseAmount,
  parseDraft,
  type CalcDraft,
  type CalcField,
  type WeighableKey,
} from "@/lib/calculator";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "@/lib/nisab";
import { KARAT_PURITY } from "@/lib/metals";
import { formatMoney, formatPercent } from "@/lib/money";
import { readStoredValue, useHydrated } from "@/lib/client-store";
import { track } from "@/lib/analytics";

/**
 * The public calculator. The server renders it empty; once in the browser it
 * remounts with whatever this visitor entered last time, kept only in their
 * own browser storage.
 */
export default function ZakatCalculator() {
  const hydrated = useHydrated();
  if (!hydrated) return <Calculator key="server" initial={emptyDraft()} live={false} />;
  return <Calculator key="client" initial={storedOrFresh()} live />;
}

function storedOrFresh(): CalcDraft {
  const locale = typeof navigator === "undefined" ? null : navigator.language;
  const stored = parseDraft(readStoredValue(CALC_STORAGE_KEY));
  // A draft is read with the decimal mark of the browser it was typed in.
  if (stored) return stored.decimal ? stored : { ...stored, decimal: decimalMarkFor(locale) };
  return emptyDraft(currencyForLocale(locale), decimalMarkFor(locale));
}

type PriceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; source: string }
  | { status: "error"; message: string };

function currencyName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function Calculator({ initial, live }: { initial: CalcDraft; live: boolean }) {
  const [draft, setDraft] = useState<CalcDraft>(initial);
  // A first visit fetches today's prices straight away (see the effect below).
  const autoFetch = live && !initial.goldPrice && !initial.silverPrice;
  const [price, setPrice] = useState<PriceState>(
    autoFetch ? { status: "loading" } : { status: "idle" },
  );
  const requested = useRef<string | null>(null);
  const outcome = useMemo(() => computeDraft(draft), [draft]);
  const { result } = outcome;
  const c = draft.currency;

  function update(patch: Partial<CalcDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }
  /** Switching to grams starts from the fineness the picker shows first. */
  function setByWeight(key: WeighableKey, on: boolean) {
    setDraft((d) => ({
      ...d,
      byWeight: { ...d.byWeight, [key]: on },
      purity:
        on && !d.purity[key]
          ? { ...d.purity, [key]: String(purityOptionsFor(key)[0].purity) }
          : d.purity,
    }));
  }

  function updateIn<K extends "amounts" | "byWeight" | "grams" | "purity" | "portions">(
    key: K,
    field: keyof CalcDraft[K],
    value: CalcDraft[K][keyof CalcDraft[K]],
  ) {
    setDraft((d) => ({ ...d, [key]: { ...d[key], [field]: value } }));
  }

  function fetchPrices(currency: string) {
    setPrice({ status: "loading" });
    void loadPrices(currency);
  }

  /** Ask for prices; state changes only once the answer is back. */
  async function loadPrices(currency: string) {
    requested.current = currency;
    const res = await fetch(`/api/metals?currency=${encodeURIComponent(currency)}`).catch(
      () => null,
    );
    const data = (await res?.json().catch(() => null)) as {
      goldPricePerGram?: number;
      silverPricePerGram?: number;
      asOf?: string;
      source?: string;
      error?: string;
    } | null;
    // A newer currency choice has asked again, or the user typed prices.
    if (requested.current !== currency) return;
    if (!res?.ok || !data?.goldPricePerGram || !data.silverPricePerGram) {
      setPrice({
        status: "error",
        message: data?.error ?? "Live prices are unavailable. Enter today’s prices per gram.",
      });
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
    setPrice({ status: "ok", source: data.source ?? "a free public source" });
  }

  // First visit in this browser: fetch today's prices for the guessed currency.
  useEffect(() => {
    if (autoFetch) void loadPrices(initial.currency);
    // Only on mount: later fetches follow a currency change or a click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the draft in this browser so a refresh does not lose it.
  useEffect(() => {
    if (!live) return;
    try {
      localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* private mode or storage full: the calculator still works */
    }
  }, [draft, live]);

  /** Typed prices win over a suggestion still on its way. */
  function typePrice(patch: Partial<CalcDraft>) {
    if (requested.current) {
      requested.current = null;
      setPrice({ status: "idle" });
    }
    update({ ...patch, pricesAsOf: null });
  }

  function changeCurrency(currency: string) {
    // Prices are per gram in the old currency; they no longer apply.
    update({ currency, goldPrice: "", silverPrice: "", pricesAsOf: null });
    fetchPrices(currency);
  }

  function clearAll() {
    if (!window.confirm("Clear everything you entered?")) return;
    setDraft({
      ...emptyDraft(draft.currency, draft.decimal),
      goldPrice: draft.goldPrice,
      silverPrice: draft.silverPrice,
      pricesAsOf: draft.pricesAsOf,
    });
  }

  // Count a visit that reached an answer, once per page view (no figures sent).
  const counted = useRef(false);
  const empty = outcome.lines.length === 0 && outcome.debts === 0;
  const answered = live && !empty && !outcome.needsPrices;
  useEffect(() => {
    if (!answered || counted.current) return;
    counted.current = true;
    track("Calculated");
  }, [answered]);

  const goldNisab = NISAB_GOLD_GRAMS * parseAmount(draft.goldPrice, draft.decimal);
  const silverNisab = NISAB_SILVER_GRAMS * parseAmount(draft.silverPrice, draft.decimal);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="space-y-10 print:hidden">
        {/* 1. Prices */}
        <section aria-labelledby="calc-prices" className="card p-5 sm:p-6">
          <p className="label text-brassDeep">Step 1</p>
          <h2 id="calc-prices" className="mt-1 font-serif text-xl text-ink">
            Today’s prices
          </h2>
          <p className="mt-1 text-sm text-sage">
            Nisab is set by the price of gold or silver. Filled in from a free
            public source when it answers; check it against your local market.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label mb-1.5" htmlFor="calc-currency">
                Currency
              </label>
              <select
                id="calc-currency"
                className="field"
                value={c}
                onChange={(e) => changeCurrency(e.target.value)}
              >
                {(CALC_CURRENCIES as readonly string[]).includes(c) ? null : (
                  <option value={c}>{c}</option>
                )}
                {CALC_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code} · {currencyName(code)}
                  </option>
                ))}
              </select>
            </div>
            <PriceInput
              id="calc-gold-price"
              label="Gold, per gram"
              currency={c}
              value={draft.goldPrice}
              onChange={(v) => typePrice({ goldPrice: v })}
            />
            <PriceInput
              id="calc-silver-price"
              label="Silver, per gram"
              currency={c}
              value={draft.silverPrice}
              onChange={(v) => typePrice({ silverPrice: v })}
            />
          </div>

          <p className="mt-3 min-h-[1.25rem] text-xs text-sage" aria-live="polite">
            {price.status === "loading"
              ? "Fetching today’s prices…"
              : price.status === "error"
                ? price.message
                : price.status === "ok" && draft.pricesAsOf
                  ? `Live prices from ${price.source}, ${new Date(draft.pricesAsOf).toLocaleString()}.`
                  : draft.pricesAsOf
                    ? `Prices fetched ${new Date(draft.pricesAsOf).toLocaleDateString()}.`
                    : null}{" "}
            {price.status !== "loading" ? (
              <button
                type="button"
                className="text-pine underline-offset-2 hover:underline"
                onClick={() => fetchPrices(c)}
              >
                {draft.goldPrice || draft.silverPrice ? "Refresh prices" : "Fetch live prices"}
              </button>
            ) : null}
          </p>

          <fieldset className="mt-5">
            <legend className="label mb-2">Nisab standard</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice
                name="standard"
                checked={draft.standard === "silver"}
                onChange={() => update({ standard: "silver" })}
                title="Silver · 595 g"
                detail={
                  silverNisab > 0
                    ? `${formatMoney(silverNisab, c)} — the lower threshold, so more people give`
                    : "The lower threshold, so more people give"
                }
              />
              <Choice
                name="standard"
                checked={draft.standard === "gold"}
                onChange={() => update({ standard: "gold" })}
                title="Gold · 85 g"
                detail={goldNisab > 0 ? formatMoney(goldNisab, c) : "The higher threshold"}
              />
            </div>
          </fieldset>
        </section>

        {/* 2. Holdings */}
        <section aria-labelledby="calc-own" className="card p-5 sm:p-6">
          <p className="label text-brassDeep">Step 2</p>
          <h2 id="calc-own" className="mt-1 font-serif text-xl text-ink">
            What you own
          </h2>
          <p className="mt-1 text-sm text-sage">
            Today’s value of what you have held for a lunar year. Leave blank
            what does not apply. Your home, car, and things you use are not
            counted.
          </p>
          <div className="mt-5 divide-y divide-mist">
            {CALC_FIELDS.map((field) => (
              <HoldingField
                key={field.key}
                field={field}
                draft={draft}
                currency={c}
                onAmount={(v) => updateIn("amounts", field.key, v)}
                onByWeight={(v) => setByWeight(field.key as WeighableKey, v)}
                onGrams={(v) => updateIn("grams", field.key as WeighableKey, v)}
                onPurity={(v) => updateIn("purity", field.key as WeighableKey, v)}
                onPortion={(v) => field.portion && updateIn("portions", field.portion, v)}
                onJewellery={(v) => update({ jewelleryCounted: v })}
              />
            ))}
          </div>
        </section>

        {/* 3. Debts */}
        <section aria-labelledby="calc-owe" className="card p-5 sm:p-6">
          <p className="label text-brassDeep">Step 3</p>
          <h2 id="calc-owe" className="mt-1 font-serif text-xl text-ink">
            What you owe now
          </h2>
          <p className="mt-1 text-sm text-sage">
            Bills, rent, credit cards, and loan instalments due now are taken
            off. A long mortgage is not deducted in full; scholars differ on
            the rest.
          </p>
          <div className="mt-4 max-w-xs">
            <MoneyInput
              id="calc-debts"
              label="Debts due now"
              currency={c}
              value={draft.debts}
              onChange={(v) => update({ debts: v })}
            />
          </div>
          <fieldset className="mt-6">
            <legend className="label mb-2">Year you count by</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice
                name="basis"
                checked={draft.basis === "lunar"}
                onChange={() => update({ basis: "lunar" })}
                title="Lunar (Hijri) year · 2.5%"
                detail="The year zakat is reckoned by."
              />
              <Choice
                name="basis"
                checked={draft.basis === "solar"}
                onChange={() => update({ basis: "solar" })}
                title="Solar year · 2.577%"
                detail="If you pay on a Gregorian date, adjusted for the longer year."
              />
            </div>
          </fieldset>
        </section>
      </div>

      {/* Result */}
      <aside
        id="result"
        aria-labelledby="calc-result"
        className="scroll-mt-6 lg:sticky lg:top-6"
      >
        <div className="card border-pine/40 p-5 sm:p-6">
          <p className="label text-pine" id="calc-result">
            Your zakat
          </p>
          <div aria-live="polite" className="mt-1">
            {outcome.needsPrices ? (
              <p className="font-serif text-xl text-ink">
                Enter today’s {draft.standard} price to compare against nisab.
              </p>
            ) : empty ? (
              <p className="font-serif text-xl text-ink">
                Enter what you own to see what is due.
              </p>
            ) : result.isDue ? (
              <>
                <p className="font-serif text-4xl text-pine nums">
                  {formatMoney(result.zakatDue, c)}
                </p>
                <p className="mt-2 text-sm text-sage">
                  {formatPercent(result.rate, draft.basis === "solar" ? 3 : 1)} of{" "}
                  {formatMoney(result.netZakatable, c)}, which is at or above the{" "}
                  {draft.standard} nisab.
                </p>
              </>
            ) : (
              <>
                <p className="font-serif text-2xl text-ink">No zakat due</p>
                <p className="mt-2 text-sm text-sage">
                  {formatMoney(result.netZakatable, c)} is{" "}
                  {formatMoney(Math.abs(result.marginToNisab), c)} below the{" "}
                  {draft.standard} nisab of {formatMoney(result.nisab, c)}.
                </p>
              </>
            )}
          </div>

          {!empty ? (
            <dl className="mt-5 space-y-1.5 border-t border-mist pt-4 text-sm">
              {outcome.lines.map((line) => (
                <div key={line.key} className="flex justify-between gap-3">
                  <dt className="text-sage">
                    {line.label}
                    {line.zakatablePortion < 1 ? (
                      <span className="block text-xs">
                        {formatPercent(line.zakatablePortion, 0)} of {formatMoney(line.amount, c)}
                      </span>
                    ) : null}
                  </dt>
                  <dd className="text-ink nums">
                    {formatMoney(line.amount * line.zakatablePortion, c)}
                  </dd>
                </div>
              ))}
              {outcome.debts > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-sage">Debts due now</dt>
                  <dd className="text-danger nums">−{formatMoney(outcome.debts, c)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 border-t border-mist pt-2 font-medium">
                <dt className="text-ink">Net zakatable wealth</dt>
                <dd className="text-ink nums">{formatMoney(result.netZakatable, c)}</dd>
              </div>
              {!outcome.needsPrices ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-sage">Nisab ({draft.standard})</dt>
                  <dd className="text-brassDeep nums">{formatMoney(result.nisab, c)}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {outcome.needsWeightPrice ? (
            <p className="mt-4 text-xs text-warn">
              Something is entered by weight, but its price per gram is missing.
            </p>
          ) : null}

          <p className="mt-5 text-xs leading-relaxed text-sage">
            Zakat is due on wealth that stayed at or above nisab for a full lunar
            year (the hawl). This is an estimate, not a ruling.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 print:hidden">
            <button type="button" className="btn-ghost" onClick={() => window.print()}>
              Print or save PDF
            </button>
            {!empty ? (
              <button type="button" className="btn-ghost" onClick={clearAll}>
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 border border-mist bg-paper/60 p-5 print:hidden">
          <p className="font-serif text-lg text-ink">Keep this as a ledger</p>
          <p className="mt-1 text-sm text-sage">
            A free account counts your hawl on the Hijri calendar, tells you when
            zakat falls due, records what you give, and closes each year with a
            statement. These figures come with you.
          </p>
          <Link href="/register?from=calculator" className="btn-primary mt-4 w-full">
            Create a free ledger
          </Link>
        </div>
      </aside>

      {/* Phone: the answer stays in view while typing. */}
      {!empty && !outcome.needsPrices ? (
        <a
          href="#result"
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-mist bg-paper/95 px-5 py-3 backdrop-blur lg:hidden print:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <span className="label">{result.isDue ? "Zakat due" : "Below nisab"}</span>
          <span className="font-serif text-xl text-pine nums">
            {result.isDue ? formatMoney(result.zakatDue, c) : formatMoney(0, c)}
          </span>
        </a>
      ) : null}
    </div>
  );
}

function purityOptionsFor(key: WeighableKey | null): { label: string; purity: number }[] {
  return key === "silver"
    ? [
        { label: "Fine (999)", purity: 0.999 },
        { label: "Sterling (925)", purity: 0.925 },
      ]
    : KARAT_PURITY.filter((k) => !k.label.startsWith("Sterling"));
}

function Choice({
  name,
  checked,
  onChange,
  title,
  detail,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label
      className={
        "flex cursor-pointer gap-3 border px-3 py-2.5 transition " +
        (checked ? "border-pine bg-pine/5" : "border-mist hover:border-sage")
      }
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 accent-[rgb(var(--c-pine))]"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block text-xs text-sage">{detail}</span>
      </span>
    </label>
  );
}

function MoneyInput({
  id,
  label,
  currency,
  value,
  onChange,
}: {
  id: string;
  label: string;
  currency: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label mb-1.5" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-sage">
          {currency}
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          className="field pl-12 nums"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function PriceInput(props: {
  id: string;
  label: string;
  currency: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return <MoneyInput {...props} />;
}

function HoldingField({
  field,
  draft,
  currency,
  onAmount,
  onByWeight,
  onGrams,
  onPurity,
  onPortion,
  onJewellery,
}: {
  field: CalcField;
  draft: CalcDraft;
  currency: string;
  onAmount: (v: string) => void;
  onByWeight: (v: boolean) => void;
  onGrams: (v: string) => void;
  onPurity: (v: string) => void;
  onPortion: (v: string) => void;
  onJewellery: (v: boolean) => void;
}) {
  const id = `calc-${field.key}`;
  const weighKey = field.metal ? (field.key as WeighableKey) : null;
  const byWeight = weighKey ? Boolean(draft.byWeight[weighKey]) : false;
  const purityOptions = purityOptionsFor(weighKey);

  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-start">
      <div>
        <label htmlFor={byWeight ? `${id}-grams` : id} className="text-sm font-medium text-ink">
          {field.label}
        </label>
        <p className="mt-0.5 text-xs leading-relaxed text-sage">{field.hint}</p>
        {weighKey ? (
          <button
            type="button"
            className="mt-1 text-xs text-pine underline-offset-2 hover:underline"
            onClick={() => onByWeight(!byWeight)}
          >
            {byWeight ? "Enter a value instead" : "Enter by weight instead"}
          </button>
        ) : null}
        {field.key === "jewellery" ? (
          <fieldset className="mt-2">
            <legend className="sr-only">Count jewellery you wear?</legend>
            <div className="flex flex-col gap-1 text-xs text-ink">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="jewellery-counted"
                  checked={!draft.jewelleryCounted}
                  onChange={() => onJewellery(false)}
                />
                Not counted (Maliki, Shafi‘i, Hanbali)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="jewellery-counted"
                  checked={draft.jewelleryCounted}
                  onChange={() => onJewellery(true)}
                />
                Counted (Hanafi)
              </label>
            </div>
          </fieldset>
        ) : null}
      </div>

      <div className="space-y-2">
        {byWeight && weighKey ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="sr-only" htmlFor={`${id}-grams`}>
                {field.label}, grams
              </label>
              <div className="relative">
                <input
                  id={`${id}-grams`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  className="field pr-8 nums"
                  value={draft.grams[weighKey] ?? ""}
                  onChange={(e) => onGrams(e.target.value)}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-sage">
                  g
                </span>
              </div>
            </div>
            <div>
              <label className="sr-only" htmlFor={`${id}-purity`}>
                {field.label}, purity
              </label>
              <select
                id={`${id}-purity`}
                className="field px-2 text-sm"
                value={draft.purity[weighKey] ?? String(purityOptions[0].purity)}
                onChange={(e) => onPurity(e.target.value)}
              >
                {purityOptions.map((k) => (
                  <option key={k.purity} value={String(k.purity)}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-sage">
              {currency}
            </span>
            <input
              id={id}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              className="field pl-12 nums"
              value={draft.amounts[field.key] ?? ""}
              onChange={(e) => onAmount(e.target.value)}
            />
          </div>
        )}
        {field.portion ? (
          <div className="flex items-center gap-2 text-xs text-sage">
            <label htmlFor={`${id}-portion`}>Counted share</label>
            <div className="relative w-20">
              <input
                id={`${id}-portion`}
                type="text"
                inputMode="decimal"
                className="field min-h-0 py-1 pr-6 text-sm nums"
                placeholder={DEFAULT_PORTION_PERCENT[field.portion]}
                value={draft.portions[field.portion] ?? ""}
                onChange={(e) => onPortion(e.target.value)}
              />
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                %
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
