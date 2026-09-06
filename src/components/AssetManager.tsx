"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LIST } from "@/lib/categories";
import { categoryForMadhhab, type Madhhab } from "@/lib/madhhab";
import { formatMoney, formatPercent } from "@/lib/money";
import type { Asset, Liability } from "@/db/schema";
import AssetImport from "./AssetImport";

export default function AssetManager({
  assets,
  liabilities,
  currency,
  madhhab = "general",
  goldPricePerGram = 0,
  silverPricePerGram = 0,
  initialCategory,
  initialLabel,
}: {
  assets: Asset[];
  liabilities: Liability[];
  currency: string;
  madhhab?: Madhhab;
  goldPricePerGram?: number;
  silverPricePerGram?: number;
  initialCategory?: string;
  initialLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startKey =
    CATEGORY_LIST.find((c) => c.key === initialCategory)?.key ??
    CATEGORY_LIST[0].key;
  const [category, setCategory] = useState(startKey);
  const [label, setLabel] = useState(initialLabel ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [grams, setGrams] = useState("");
  const [purity, setPurity] = useState("1");
  const [portion, setPortion] = useState(
    categoryForMadhhab(startKey, madhhab).defaultZakatablePortion,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(null);
  const meta = useMemo(
    () => categoryForMadhhab(category, madhhab),
    [category, madhhab],
  );

  const isMetal =
    category === "gold" || category === "silver" || category === "jewellery";
  const metalPrice =
    category === "silver" ? silverPricePerGram : goldPricePerGram;

  function applyWeight() {
    const g = parseFloat(grams);
    const p = parseFloat(purity);
    if (!(g > 0) || !(p > 0) || !(metalPrice > 0)) return;
    const value = Math.round(g * p * metalPrice * 100) / 100;
    setAmount(String(value));
    const purityPct = Math.round(p * 1000) / 10;
    setNote(
      `${g}g × ${purityPct}% × ${metalPrice}/${currency} per g (from settings)`,
    );
  }

  function pickCategory(next: string) {
    setCategory(next as typeof category);
    setPortion(categoryForMadhhab(next, madhhab).defaultZakatablePortion);
  }

  async function addAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.get("category"),
        label: form.get("label"),
        amount: form.get("amount"),
        zakatablePortion: form.get("zakatablePortion") ?? portion,
        hawlStartDate: form.get("hawlStartDate") || null,
        note: form.get("note") || null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      pickCategory(CATEGORY_LIST[0].key);
      setLabel("");
      setAmount("");
      setNote("");
      setGrams("");
      setPurity("1");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not add asset");
    }
  }

  async function removeAsset(id: string, label: string) {
    if (!window.confirm(`Remove “${label}” from the ledger?`)) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function saveAsset(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.get("category"),
        label: form.get("label"),
        amount: form.get("amount"),
        zakatablePortion: form.get("zakatablePortion") ?? 1,
        hawlStartDate: form.get("hawlStartDate") || null,
        note: form.get("note") || null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function addLiability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/liabilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.get("label"),
        amount: form.get("amount"),
        deductible: form.get("deductible") === "on",
      }),
    });
    setBusy(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  async function removeLiability(id: string, label: string) {
    if (!window.confirm(`Remove liability “${label}”?`)) return;
    await fetch(`/api/liabilities/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function saveLiability(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/liabilities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.get("label"),
        amount: form.get("amount"),
        deductible: form.get("deductible") === "on",
      }),
    });
    setBusy(false);
    if (res.ok) {
      setEditingLiabilityId(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-10">
      <AssetImport currency={currency} madhhab={madhhab} />

      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Add an asset</h2>
        <form onSubmit={addAsset} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label mb-1.5" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="field"
                value={category}
                onChange={(e) => pickCategory(e.target.value)}
              >
                <optgroup label="Liquid">
                  {CATEGORY_LIST.filter((c) => c.group === "liquid").map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Metals">
                  {CATEGORY_LIST.filter((c) => c.group === "metals").map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Investments">
                  {CATEGORY_LIST.filter((c) => c.group === "investments").map(
                    (c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ),
                  )}
                </optgroup>
                <optgroup label="Business">
                  {CATEGORY_LIST.filter((c) => c.group === "business").map(
                    (c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ),
                  )}
                </optgroup>
                <optgroup label="Other">
                  {CATEGORY_LIST.filter((c) => c.group === "other").map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="label">
                Description
              </label>
              <input
                id="label"
                name="label"
                className="field"
                placeholder="e.g. TFSA savings"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
          </div>

          {isMetal && (
            <div className="border border-dashed border-mist px-4 py-3">
              <p className="label text-brass">From weight</p>
              <p className="mt-1 text-xs text-sage">
                Enter grams and purity; value uses your metal price in settings
                ({metalPrice > 0 ? `${metalPrice} ${currency}/g` : "set a price first"}
                ).
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label mb-1" htmlFor="grams">
                    Grams
                  </label>
                  <input
                    id="grams"
                    type="number"
                    step="0.01"
                    min="0"
                    className="field nums"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label mb-1" htmlFor="purity">
                    Purity (0–1)
                  </label>
                  <input
                    id="purity"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="field nums"
                    value={purity}
                    onChange={(e) => setPurity(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="btn-ghost w-full"
                    onClick={applyWeight}
                    disabled={!(metalPrice > 0)}
                  >
                    Fill value
                  </button>
                </div>
              </div>
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
            <div>
              <label className="label mb-1.5" htmlFor="amount">
                Value ({currency})
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                className="field nums"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            {meta.portionEditable && (
              <div>
                <label className="label mb-1.5" htmlFor="zakatablePortion">
                  Zakatable portion (0 to 1)
                </label>
                <input
                  id="zakatablePortion"
                  name="zakatablePortion"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  className="field nums"
                  value={portion}
                  onChange={(e) => setPortion(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
            <div>
              <label className="label mb-1.5" htmlFor="hawlStartDate">
                Hawl start (optional)
              </label>
              <input
                id="hawlStartDate"
                name="hawlStartDate"
                type="date"
                className="field"
              />
              <p className="mt-1 text-xs text-sage">
                Reminder only — does not change payable zakat yet. Leave blank
                to follow the ledger hawl in settings.
              </p>
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="note">
                Note (optional)
              </label>
              <input
                id="note"
                name="note"
                className="field"
                placeholder="e.g. inherited"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <p className="rounded-card bg-porcelain px-3 py-2 text-xs leading-relaxed text-sage">
            {meta.note}
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary">
            Add asset
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg text-ink">
          Your assets{" "}
          <span className="text-sm font-normal text-sage">({assets.length})</span>
        </h2>
        {assets.length === 0 ? (
          <p className="border border-dashed border-mist p-5 text-sm text-sage">
            No assets yet. Add your first one above to begin your accounting.
          </p>
        ) : (
          <ul className="divide-y divide-mist border-y border-mist">
            {assets.map((a) => {
              const m = categoryForMadhhab(a.category, madhhab);
              const zakatable = a.amount * a.zakatablePortion;
              if (editingId === a.id) {
                const editMeta = categoryForMadhhab(a.category, madhhab);
                return (
                  <li key={a.id} className="p-4">
                    <form
                      onSubmit={(e) => saveAsset(e, a.id)}
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      <select name="category" className="field" defaultValue={a.category}>
                        {CATEGORY_LIST.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input name="label" className="field" defaultValue={a.label} required />
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="field nums"
                        defaultValue={a.amount}
                        required
                      />
                      {editMeta.portionEditable && (
                        <input
                          name="zakatablePortion"
                          type="number"
                          step="0.05"
                          min="0"
                          max="1"
                          className="field nums"
                          defaultValue={a.zakatablePortion}
                        />
                      )}
                      <input
                        name="hawlStartDate"
                        type="date"
                        className="field"
                        defaultValue={a.hawlStartDate ?? ""}
                      />
                      <input
                        name="note"
                        className="field"
                        defaultValue={a.note ?? ""}
                        placeholder="Note"
                      />
                      <div className="flex gap-2 sm:col-span-2">
                        <button type="submit" disabled={busy} className="btn-primary">
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </li>
                );
              }
              return (
                <li key={a.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{a.label}</p>
                    <p className="text-xs text-sage">
                      {m.label}
                      {a.zakatablePortion < 1 && (
                        <> · {formatPercent(a.zakatablePortion, 0)} zakatable</>
                      )}
                      {a.hawlStartDate && <> · hawl {a.hawlStartDate}</>}
                      {a.note && <> · {a.note}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium text-ink nums">
                        {formatMoney(a.amount, currency)}
                      </p>
                      {a.zakatablePortion < 1 && (
                        <p className="text-xs text-brass nums">
                          {formatMoney(zakatable, currency)} counted
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingId(a.id)}
                      className="text-sm text-pine hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeAsset(a.id, a.label)}
                      className="text-sage transition hover:text-danger"
                      aria-label={`Remove ${a.label}`}
                    >
                      &times;
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-serif text-lg text-ink">Deductible liabilities</h2>
        <p className="mb-4 text-sm text-sage">
          Immediate debts can be deducted from your zakatable wealth. Treatment of
          long-term debt varies, so each entry can be marked deductible or not.
        </p>

        <form
          onSubmit={addLiability}
          className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
        >
          <div>
            <label className="label mb-1.5" htmlFor="lab-label">
              Description
            </label>
            <input
              id="lab-label"
              name="label"
              className="field"
              placeholder="e.g. credit card balance"
              required
            />
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="lab-amount">
              Amount
            </label>
            <input
              id="lab-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              className="field nums w-32"
              placeholder="0.00"
              required
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-sage">
            <input
              type="checkbox"
              name="deductible"
              defaultChecked
              className="h-4 w-4 accent-pine"
            />
            Deductible
          </label>
          <button type="submit" disabled={busy} className="btn-ghost">
            Add
          </button>
        </form>

        {liabilities.length > 0 && (
          <ul className="divide-y divide-mist border-y border-mist">
            {liabilities.map((l) => {
              if (editingLiabilityId === l.id) {
                return (
                  <li key={l.id} className="p-4">
                    <form
                      onSubmit={(e) => saveLiability(e, l.id)}
                      className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
                    >
                      <input
                        name="label"
                        className="field"
                        defaultValue={l.label}
                        required
                      />
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="field nums w-32"
                        defaultValue={l.amount}
                        required
                      />
                      <label className="flex items-center gap-2 text-sm text-sage">
                        <input
                          type="checkbox"
                          name="deductible"
                          defaultChecked={l.deductible}
                          className="h-4 w-4 accent-pine"
                        />
                        Deductible
                      </label>
                      <div className="flex gap-2 sm:col-span-3">
                        <button type="submit" disabled={busy} className="btn-primary">
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => setEditingLiabilityId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </li>
                );
              }
              return (
                <li key={l.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{l.label}</p>
                    <p className="text-xs text-sage">
                      {l.deductible ? "Deductible" : "Not deducted"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={
                        "font-medium nums " + (l.deductible ? "text-danger" : "text-sage")
                      }
                    >
                      {l.deductible ? "-" : ""}
                      {formatMoney(l.amount, currency)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingLiabilityId(l.id)}
                      className="text-sm text-pine hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeLiability(l.id, l.label)}
                      className="text-sage transition hover:text-danger"
                      aria-label={`Remove ${l.label}`}
                    >
                      &times;
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
