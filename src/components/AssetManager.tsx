"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LIST, categoryMeta } from "@/lib/categories";
import { formatMoney, formatPercent } from "@/lib/money";
import type { Asset, Liability } from "@/db/schema";

export default function AssetManager({
  assets,
  liabilities,
  currency,
}: {
  assets: Asset[];
  liabilities: Liability[];
  currency: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState(CATEGORY_LIST[0].key);
  const meta = categoryMeta(category);

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
        zakatablePortion: form.get("zakatablePortion") ?? 1,
      }),
    });
    setBusy(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      setCategory(CATEGORY_LIST[0].key);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not add asset");
    }
  }

  async function removeAsset(id: string) {
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    router.refresh();
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

  async function removeLiability(id: string) {
    await fetch(`/api/liabilities/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {/* Add asset */}
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
                onChange={(e) => setCategory(e.target.value as typeof category)}
              >
                {CATEGORY_LIST.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
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
                required
              />
            </div>
          </div>

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
                  defaultValue={meta.defaultZakatablePortion}
                  className="field nums"
                />
              </div>
            )}
          </div>

          <p className="rounded-lg bg-porcelain px-3 py-2 text-xs leading-relaxed text-sage">
            {meta.note}
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary">
            Add asset
          </button>
        </form>
      </section>

      {/* Asset list */}
      <section>
        <h2 className="mb-3 font-serif text-lg text-ink">
          Your assets{" "}
          <span className="text-sm font-normal text-sage">({assets.length})</span>
        </h2>
        {assets.length === 0 ? (
          <p className="card p-5 text-sm text-sage">
            No assets yet. Add your first one above to begin your accounting.
          </p>
        ) : (
          <ul className="divide-y divide-mist overflow-hidden card">
            {assets.map((a) => {
              const m = categoryMeta(a.category);
              const zakatable = a.amount * a.zakatablePortion;
              return (
                <li key={a.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{a.label}</p>
                    <p className="text-xs text-sage">
                      {m.label}
                      {a.zakatablePortion < 1 && (
                        <> · {formatPercent(a.zakatablePortion, 0)} zakatable</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
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
                      onClick={() => removeAsset(a.id)}
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

      {/* Liabilities */}
      <section>
        <h2 className="mb-1 font-serif text-lg text-ink">Deductible liabilities</h2>
        <p className="mb-4 text-sm text-sage">
          Immediate debts can be deducted from your zakatable wealth. Treatment of
          long-term debt varies, so each entry can be marked deductible or not.
        </p>

        <form onSubmit={addLiability} className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <div>
            <label className="label mb-1.5" htmlFor="lab-label">
              Description
            </label>
            <input id="lab-label" name="label" className="field" placeholder="e.g. credit card balance" required />
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="lab-amount">
              Amount
            </label>
            <input id="lab-amount" name="amount" type="number" step="0.01" min="0" className="field nums w-32" placeholder="0.00" required />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-sage">
            <input type="checkbox" name="deductible" defaultChecked className="h-4 w-4 accent-pine" />
            Deductible
          </label>
          <button type="submit" disabled={busy} className="btn-ghost">
            Add
          </button>
        </form>

        {liabilities.length > 0 && (
          <ul className="divide-y divide-mist overflow-hidden card">
            {liabilities.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{l.label}</p>
                  <p className="text-xs text-sage">
                    {l.deductible ? "Deductible" : "Not deducted"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className={"font-medium nums " + (l.deductible ? "text-danger" : "text-sage")}>
                    {l.deductible ? "-" : ""}
                    {formatMoney(l.amount, currency)}
                  </p>
                  <button
                    onClick={() => removeLiability(l.id)}
                    className="text-sage transition hover:text-danger"
                    aria-label={`Remove ${l.label}`}
                  >
                    &times;
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
