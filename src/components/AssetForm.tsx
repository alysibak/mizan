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
import { formatMoney } from "@/lib/money";
import { sendJson } from "@/lib/client-fetch";
import type { Asset } from "@/db/schema";

const GROUPS: { key: CategoryMeta["group"]; label: string }[] = [
  { key: "liquid", label: "Liquid" },
  { key: "metals", label: "Metals" },
  { key: "investments", label: "Investments" },
  { key: "business", label: "Business" },
  { key: "other", label: "Other" },
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
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
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
      amount: weighed ? weightValue : amount,
      // Fixed-portion categories always count in full.
      zakatablePortion: meta.portionEditable ? portion : meta.defaultZakatablePortion,
      hawlStartDate: hawlStartDate || null,
      note: note || null,
      grams: weighed ? grams : null,
      purity: weighed ? purity : null,
      metal: weighed && category === "jewellery" ? metal : null,
    };
    const res = asset
      ? await sendJson(`/api/assets/${asset.id}`, "PATCH", body, "Could not save this holding")
      : await sendJson("/api/assets", "POST", body, "Could not add this holding");
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
            Category
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
            Description
          </label>
          <input
            id={`${idPrefix}-label`}
            className="field"
            placeholder="e.g. TFSA savings"
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
            Value by weight — follows the {activeMetal} price in settings
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
                  Purity (0–1)
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
                  ? `${formatMoney(perGram, currency)}/g from settings → ${formatMoney(weightValue, currency)}. Updates when you save new metal prices.`
                  : `Set a ${activeMetal} price in settings first.`}
              </p>
            </div>
          )}
        </div>
      )}

      {(category === "receivables" || category === "business_inventory") && (
        <p className="text-xs text-sage">
          {category === "receivables"
            ? "Lower the zakatable portion if recovery is doubtful — many defer until received."
            : "Use current resale value of goods held for sale, not what you paid."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {!weighed && (
          <div>
            <label className="label mb-1.5" htmlFor={`${idPrefix}-amount`}>
              Value ({currency})
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
              Zakatable portion (0 to 1)
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
        <div>
          <label className="label mb-1.5" htmlFor={`${idPrefix}-hawl`}>
            Hawl start (optional)
          </label>
          <input
            id={`${idPrefix}-hawl`}
            type="date"
            className="field"
            value={hawlStartDate}
            onChange={(e) => setHawlStartDate(e.target.value)}
          />
          <p className="mt-1 text-xs text-sage">
            Reminder only — does not change payable zakat. Leave blank to follow
            the ledger hawl in settings.
          </p>
        </div>
        <div>
          <label className="label mb-1.5" htmlFor={`${idPrefix}-note`}>
            Note (optional)
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
          {busy ? "Saving…" : editing ? "Save" : "Add asset"}
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
