"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LIST, type CategoryMeta } from "@/lib/categories";
import { categoryForMadhhab, type Madhhab } from "@/lib/madhhab";
import {
  KARAT_PURITY,
  isWeighable,
  metalFor,
  pricePerGram,
  valueByWeight,
  type Metal,
} from "@/lib/metals";
import { formatMoney, toCents } from "@/lib/money";
import { sendJson } from "@/lib/client-fetch";
import type { Asset } from "@/db/schema";

const GROUPS: { key: CategoryMeta["group"]; label: string }[] = [
  { key: "liquid", label: "Money" },
  { key: "metals", label: "Gold and silver" },
  { key: "investments", label: "Shares and savings plans" },
  { key: "business", label: "Business" },
  { key: "other", label: "Something else" },
];

export type AssetPrices = { goldPricePerGram: number; silverPricePerGram: number };

/**
 * One form for adding and editing a holding, so both follow the same rules:
 * the zakatable portion resets to the category default when the category
 * changes, and metals can be entered by weight to follow the price in settings.
 */
export default function AssetForm({
  asset,
  currency,
  madhhab,
  prices,
  initialCategory,
  initialLabel,
  onSaved,
  onCancel,
}: {
  /** The holding being edited; omit to add a new one. */
  asset?: Asset;
  currency: string;
  madhhab: Madhhab;
  prices: AssetPrices;
  initialCategory?: string;
  initialLabel?: string;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const editing = Boolean(asset);
  const idPrefix = asset ? `asset-${asset.id}` : "asset-new";
  const startCategory =
    asset?.category ??
    CATEGORY_LIST.find((c) => c.key === initialCategory)?.key ??
    CATEGORY_LIST[0].key;

  const [category, setCategory] = useState<string>(startCategory);
  const [label, setLabel] = useState(asset?.label ?? initialLabel ?? "");
  const [amount, setAmount] = useState(asset ? String(asset.amount) : "");
  const [portion, setPortion] = useState(
    String(asset?.zakatablePortion ?? categoryForMadhhab(startCategory, madhhab).defaultZakatablePortion),
  );
  const [hawlStartDate, setHawlStartDate] = useState(asset?.hawlStartDate ?? "");
  const [note, setNote] = useState(asset?.note ?? "");
  const [byWeight, setByWeight] = useState(Boolean(asset?.grams));
  const [inForeign, setInForeign] = useState(Boolean(asset?.foreignCurrency));
  const [foreignCurrency, setForeignCurrency] = useState(asset?.foreignCurrency ?? "USD");
  const [foreignAmount, setForeignAmount] = useState(
    asset?.foreignAmount != null ? String(asset.foreignAmount) : "",
  );
  const [fxRate, setFxRate] = useState(asset?.fxRate != null ? String(asset.fxRate) : "");
  const [rateHint, setRateHint] = useState<string | null>(null);
  const [grams, setGrams] = useState(asset?.grams ? String(asset.grams) : "");
  const [purity, setPurity] = useState(String(asset?.purity ?? 1));
  const [metal, setMetal] = useState<Metal>(
    asset?.metal === "silver" ? "silver" : "gold",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = useMemo(() => categoryForMadhhab(category, madhhab), [category, madhhab]);
  const weighable = isWeighable(category);
  const weighed = weighable && byWeight;
  const foreign = !weighed && inForeign;
  const foreignValue = foreign
    ? toCents((parseFloat(foreignAmount) || 0) * (parseFloat(fxRate) || 0))
    : 0;

  async function suggestRate() {
    setRateHint(null);
    const res = await fetch(
      `/api/fx?from=${encodeURIComponent(foreignCurrency)}&to=${encodeURIComponent(currency)}`,
    ).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) ?? {};
    if (!res?.ok) {
      setRateHint(data.error || "Enter the rate by hand.");
      return;
    }
    setFxRate(String(data.rate));
    setRateHint(
      `From ${data.source ?? "a free source"}${data.asOf ? `, ${data.asOf}` : ""}. Check it against your bank's rate.`,
    );
  }
  const activeMetal = metalFor(category, metal);
  const perGram = activeMetal ? pricePerGram(activeMetal, prices) : 0;
  const weightValue = weighed
    ? valueByWeight(parseFloat(grams), parseFloat(purity), perGram)
    : 0;

  function pickCategory(next: string) {
    setCategory(next);
    // A new category brings its own default portion; keeping the old one is
    // how cash ended up counted at 25% or long-term stocks at 100%.
    setPortion(String(categoryForMadhhab(next, madhhab).defaultZakatablePortion));
    if (!isWeighable(next)) setByWeight(false);
  }

  function reset() {
    pickCategory(CATEGORY_LIST[0].key);
    setLabel("");
    setAmount("");
    setHawlStartDate("");
    setNote("");
    setByWeight(false);
    setGrams("");
    setPurity("1");
    setMetal("gold");
    setInForeign(false);
    setForeignAmount("");
    setFxRate("");
    setRateHint(null);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (foreign && !(parseFloat(fxRate) > 0)) {
      setError(`Enter how many ${currency} one ${foreignCurrency} is worth.`);
      return;
    }
    if (weighed && !(weightValue > 0)) {
      setError(
        perGram > 0
          ? "Enter the weight in grams and a purity above zero."
          : `Set a ${activeMetal} price in settings before valuing by weight.`,
      );
      return;
    }
    setBusy(true);
    const body = {
      category,
      label,
      amount: weighed ? weightValue : foreign ? foreignValue : amount,
      // Fixed-portion categories always count in full.
      zakatablePortion: meta.portionEditable ? portion : meta.defaultZakatablePortion,
      hawlStartDate: hawlStartDate || null,
      note: note || null,
      grams: weighed ? grams : null,
      purity: weighed ? purity : null,
      metal: weighed && category === "jewellery" ? metal : null,
      foreignCurrency: foreign ? foreignCurrency : null,
      foreignAmount: foreign ? foreignAmount : null,
      fxRate: foreign ? fxRate : null,
    };
    const res = asset
      ? await sendJson(`/api/assets/${asset.id}`, "PATCH", body, "Could not save this")
      : await sendJson("/api/assets", "POST", body, "Could not add this");
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (!editing) reset();
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label mb-1.5" htmlFor={`${idPrefix}-category`}>
            What kind
          </label>
          <select
            id={`${idPrefix}-category`}
            className="field"
            value={category}
            onChange={(e) => pickCategory(e.target.value)}
          >
            {GROUPS.map((g) => (
              <optgroup key={g.key} label={g.label}>
                {CATEGORY_LIST.filter((c) => c.group === g.key).map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1.5" htmlFor={`${idPrefix}-label`}>
            Name it
          </label>
          <input
            id={`${idPrefix}-label`}
            className="field"
            placeholder="e.g. My savings account"
            value={label}
            maxLength={120}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>
      </div>

      {weighable && (
        <div className="border border-dashed border-mist px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 accent-pine"
              checked={byWeight}
              onChange={(e) => setByWeight(e.target.checked)}
            />
            Value by weight, at today’s {activeMetal} price
          </label>
          {byWeight && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label mb-1" htmlFor={`${idPrefix}-grams`}>
                  Grams
                </label>
                <input
                  id={`${idPrefix}-grams`}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className="field nums"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label mb-1" htmlFor={`${idPrefix}-purity`}>
                  Purity (22 carat is 0.916)
                </label>
                <input
                  id={`${idPrefix}-purity`}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  max="1"
                  list={`${idPrefix}-karats`}
                  className="field nums"
                  value={purity}
                  onChange={(e) => setPurity(e.target.value)}
                  required
                />
                <datalist id={`${idPrefix}-karats`}>
                  {KARAT_PURITY.map((k) => (
                    <option key={k.label} value={k.purity}>
                      {k.label}
                    </option>
                  ))}
                </datalist>
              </div>
              {category === "jewellery" ? (
                <div>
                  <label className="label mb-1" htmlFor={`${idPrefix}-metal`}>
                    Metal
                  </label>
                  <select
                    id={`${idPrefix}-metal`}
                    className="field"
                    value={metal}
                    onChange={(e) => setMetal(e.target.value === "silver" ? "silver" : "gold")}
                  >
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                  </select>
                </div>
              ) : null}
              <p className="text-xs text-sage sm:col-span-3">
                {perGram > 0
                  ? `${formatMoney(perGram, currency)} a gram → ${formatMoney(weightValue, currency)}. It changes when you update prices in Settings.`
                  : `Set a ${activeMetal} price in Settings first.`}
              </p>
            </div>
          )}
        </div>
      )}

      {!weighed && (
        <div className="border border-dashed border-mist px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 accent-pine"
              checked={inForeign}
              onChange={(e) => setInForeign(e.target.checked)}
            />
            Held in another currency
          </label>
          {inForeign && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label mb-1" htmlFor={`${idPrefix}-fcur`}>
                  Currency
                </label>
                <input
                  id={`${idPrefix}-fcur`}
                  className="field uppercase"
                  maxLength={3}
                  autoCapitalize="characters"
                  autoComplete="off"
                  value={foreignCurrency}
                  onChange={(e) => setForeignCurrency(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div>
                <label className="label mb-1" htmlFor={`${idPrefix}-famount`}>
                  Amount ({foreignCurrency || "…"})
                </label>
                <input
                  id={`${idPrefix}-famount`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="field nums"
                  value={foreignAmount}
                  onChange={(e) => setForeignAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label mb-1" htmlFor={`${idPrefix}-rate`}>
                  1 {foreignCurrency || "…"} = ? {currency}
                </label>
                <input
                  id={`${idPrefix}-rate`}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className="field nums"
                  value={fxRate}
                  onChange={(e) => setFxRate(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => void suggestRate()}
                  disabled={foreignCurrency.length !== 3}
                >
                  Look up the rate
                </button>
                <p className="text-xs text-sage">
                  {foreignValue > 0
                    ? `Counts as ${formatMoney(foreignValue, currency)}. `
                    : ""}
                  {rateHint ?? "Use the rate you would really get, and update it on your zakat day."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {(category === "receivables" || category === "business_inventory") && (
        <p className="text-xs text-sage">
          {category === "receivables"
            ? "Not sure you will be paid back? Lower the part that counts: many count it only once it is paid."
            : "Use what the goods would sell for today, not what you paid."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {!weighed && !foreign && (
          <div>
            <label className="label mb-1.5" htmlFor={`${idPrefix}-amount`}>
              Amount ({currency})
            </label>
            <input
              id={`${idPrefix}-amount`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="field nums"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        )}
        {meta.portionEditable && (
          <div>
            <label className="label mb-1.5" htmlFor={`${idPrefix}-portion`}>
              Part that counts (1 = all, 0.5 = half)
            </label>
            <input
              id={`${idPrefix}-portion`}
              type="number"
              inputMode="decimal"
              step="0.05"
              min="0"
              max="1"
              className="field nums"
              value={portion}
              onChange={(e) => setPortion(e.target.value)}
              required
            />
          </div>
        )}
      </div>

      <details open={Boolean(asset?.hawlStartDate || asset?.note) || undefined}>
        <summary className="cursor-pointer text-sm text-pine hover:underline">
          Add a note or a reminder date (optional)
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5" htmlFor={`${idPrefix}-hawl`}>
              Reminder date
            </label>
            <input
              id={`${idPrefix}-hawl`}
              type="date"
              className="field"
              value={hawlStartDate}
              onChange={(e) => setHawlStartDate(e.target.value)}
            />
            <p className="mt-1 text-xs text-sage">
              Only a reminder, such as for money that came in later. Your zakat is
              still worked out on your zakat day.
            </p>
          </div>
          <div>
            <label className="label mb-1.5" htmlFor={`${idPrefix}-note`}>
              Note
            </label>
            <input
              id={`${idPrefix}-note`}
              className="field"
              placeholder="e.g. inherited"
              value={note}
              maxLength={400}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </details>

      <p className="rounded-card bg-porcelain px-3 py-2 text-xs leading-relaxed text-sage">
        {meta.note}
      </p>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : editing ? "Save" : "Add it"}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
