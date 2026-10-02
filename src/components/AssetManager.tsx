"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categoryForMadhhab, type Madhhab } from "@/lib/madhhab";
import { formatMoney, formatPercent } from "@/lib/money";
import { sendJson } from "@/lib/client-fetch";
import type { Asset, Liability } from "@/db/schema";
import AssetImport from "./AssetImport";
import AssetForm from "./AssetForm";

function weightNote(a: Asset): string | null {
  if (!a.grams) return null;
  const purity = a.purity ?? 1;
  const metal = a.metal ?? (a.category === "silver" ? "silver" : "gold");
  return `${a.grams} g × ${Math.round(purity * 1000) / 10}% ${metal}`;
}

function LiabilityForm({
  liability,
  onSaved,
  onCancel,
}: {
  liability?: Liability;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const idPrefix = liability ? `liability-${liability.id}` : "liability-new";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const body = {
      label: form.get("label"),
      amount: form.get("amount"),
      deductible: form.get("deductible") === "on",
    };
    const res = liability
      ? await sendJson(`/api/liabilities/${liability.id}`, "PATCH", body, "Could not save this debt")
      : await sendJson("/api/liabilities", "POST", body, "Could not add this debt");
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (!liability) formEl.reset();
    onSaved();
  }

  return (
    <form
      onSubmit={submit}
      className={
        liability
          ? "grid gap-3 sm:grid-cols-[1fr_auto_auto]"
          : "card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      }
    >
      <div>
        <label className="label mb-1.5" htmlFor={`${idPrefix}-label`}>
          Description
        </label>
        <input
          id={`${idPrefix}-label`}
          name="label"
          className="field"
          placeholder="e.g. credit card balance"
          defaultValue={liability?.label}
          maxLength={120}
          required
        />
      </div>
      <div>
        <label className="label mb-1.5" htmlFor={`${idPrefix}-amount`}>
          Amount
        </label>
        <input
          id={`${idPrefix}-amount`}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          className="field nums sm:w-32"
          placeholder="0.00"
          defaultValue={liability?.amount}
          required
        />
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm text-sage sm:self-end">
        <input
          type="checkbox"
          name="deductible"
          defaultChecked={liability?.deductible ?? true}
          className="h-4 w-4 accent-pine"
        />
        Deductible
      </label>
      <div className={"flex gap-2 " + (liability ? "sm:col-span-3" : "sm:self-end")}>
        <button
          type="submit"
          disabled={busy}
          className={liability ? "btn-primary" : "btn-ghost"}
        >
          {busy ? "Saving…" : liability ? "Save" : "Add"}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-danger sm:col-span-full" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

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
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(null);
  const prices = { goldPricePerGram, silverPricePerGram };

  async function remove(kind: "assets" | "liabilities", id: string, label: string) {
    const what = kind === "assets" ? "from the ledger" : "liability";
    if (!window.confirm(`Remove “${label}” ${what}?`)) return;
    setError(null);
    const res = await sendJson(`/api/${kind}/${id}`, "DELETE", undefined, `Could not remove “${label}”`);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <AssetImport currency={currency} madhhab={madhhab} />

      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Add an asset</h2>
        <div className="mt-4">
          <AssetForm
            currency={currency}
            madhhab={madhhab}
            prices={prices}
            initialCategory={initialCategory}
            initialLabel={initialLabel}
            onSaved={() => router.refresh()}
          />
        </div>
      </section>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

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
              const weight = weightNote(a);
              if (editingId === a.id) {
                return (
                  <li key={a.id} className="py-4">
                    <AssetForm
                      asset={a}
                      currency={currency}
                      madhhab={madhhab}
                      prices={prices}
                      onSaved={() => {
                        setEditingId(null);
                        router.refresh();
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </li>
                );
              }
              return (
                <li key={a.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{a.label}</p>
                    <p className="text-xs text-sage">
                      {m.label}
                      {weight && <> · {weight}</>}
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
                      aria-label={`Edit ${a.label}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove("assets", a.id, a.label)}
                      className="-m-2 p-2 text-lg leading-none text-sage transition hover:text-danger"
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

        <LiabilityForm onSaved={() => router.refresh()} />

        {liabilities.length > 0 && (
          <ul className="divide-y divide-mist border-y border-mist">
            {liabilities.map((l) => {
              if (editingLiabilityId === l.id) {
                return (
                  <li key={l.id} className="py-4">
                    <LiabilityForm
                      liability={l}
                      onSaved={() => {
                        setEditingLiabilityId(null);
                        router.refresh();
                      }}
                      onCancel={() => setEditingLiabilityId(null)}
                    />
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
                      {l.deductible ? "−" : ""}
                      {formatMoney(l.amount, currency)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingLiabilityId(l.id)}
                      className="text-sm text-pine hover:underline"
                      aria-label={`Edit ${l.label}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove("liabilities", l.id, l.label)}
                      className="-m-2 p-2 text-lg leading-none text-sage transition hover:text-danger"
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
