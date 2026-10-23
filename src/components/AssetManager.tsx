"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categoryForMadhhab, type Madhhab } from "@/lib/madhhab";
import { formatMoney, formatPercent, sumCents } from "@/lib/money";
import { sendJson } from "@/lib/client-fetch";
import type { Asset, Liability } from "@/db/schema";
import AssetImport from "./AssetImport";
import AssetForm from "./AssetForm";
import { readableDay } from "@/lib/dates";

function foreignNote(a: Asset): string | null {
  if (!a.foreignCurrency || a.foreignAmount == null || !a.fxRate) return null;
  return `${formatMoney(a.foreignAmount, a.foreignCurrency)} @ ${a.fxRate}`;
}

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
          What it is
        </label>
        <input
          id={`${idPrefix}-label`}
          name="label"
          className="field"
          placeholder="e.g. Credit card bill"
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
        Take it off
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
    const what = kind === "assets" ? "from what you own" : "debt";
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
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg text-ink">
            Added so far{" "}
            <span className="text-sm font-normal text-sage">({assets.length})</span>
          </h2>
          {assets.length > 0 ? (
            <p className="text-sm text-sage nums">
              {formatMoney(sumCents(assets.map((a) => a.amount)), currency)} in all ·{" "}
              <span className="text-ink">
                {formatMoney(sumCents(assets.map((a) => a.amount * a.zakatablePortion)), currency)}
              </span>{" "}
              counts for zakat
            </p>
          ) : null}
        </div>
        {assets.length === 0 ? (
          <p className="border border-dashed border-mist p-5 text-sm text-sage">
            Nothing added yet. Add your savings, cash or gold below.
          </p>
        ) : (
          <ul className="divide-y divide-mist border-y border-mist">
            {assets.map((a) => {
              const m = categoryForMadhhab(a.category, madhhab);
              const zakatable = a.amount * a.zakatablePortion;
              const weight = weightNote(a);
              if (editingId === a.id) {
                return (
                  <li key={a.id} className="space-y-3 py-4">
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
                    <button type="button" className="btn-danger" onClick={() => remove("assets", a.id, a.label)}>
                      Remove “{a.label}”
                    </button>
                  </li>
                );
              }
              // The kind is shown only when the name does not already say it.
              const kind = m.label.toLowerCase() === a.label.trim().toLowerCase() ? null : m.label;
              const details = [
                kind,
                weight,
                foreignNote(a),
                a.zakatablePortion < 1
                  ? a.zakatablePortion <= 0
                    ? "not counted"
                    : `only ${formatPercent(a.zakatablePortion, 0)} is counted`
                  : null,
                a.hawlStartDate ? `reminder ${readableDay(a.hawlStartDate)}` : null,
                a.note,
              ].filter(Boolean);
              return (
                <li key={a.id}>
                  {/* The whole row opens it for changes; removing is inside, away from a stray tap. */}
                  <button
                    type="button"
                    onClick={() => setEditingId(a.id)}
                    className="flex min-h-[3.5rem] w-full items-center justify-between gap-4 py-3 text-left transition hover:bg-mist/30"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{a.label}</span>
                      {details.length > 0 ? (
                        <span className="block text-xs text-sage">{details.join(" · ")}</span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-right">
                        <span className="block font-medium text-ink nums">{formatMoney(a.amount, currency)}</span>
                        {a.zakatablePortion < 1 && (
                          <span className="block text-xs text-brassDeep nums">
                            {formatMoney(zakatable, currency)} counted
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-pine">Edit</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {assets.some((a) => a.category === "receivables") ? (
        <p className="text-sm text-sage">
          Someone cannot pay you back?{" "}
          <Link href="/tools/forgive" className="text-pine underline underline-offset-2">
            Forgive the debt
          </Link>
          , and it stops counting for zakat.
        </p>
      ) : null}

      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Add something you own</h2>
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

      <section id="debts" className="scroll-mt-20">
        <h2 className="mb-1 font-serif text-lg text-ink">Debts you owe</h2>
        <p className="mb-2 text-sm text-sage">
          Bills and payments due soon are taken off what counts.
        </p>
        <details className="mb-4 text-sm text-sage">
          <summary className="text-pine">A long loan, like a mortgage?</summary>
          <p className="mt-1">
            Scholars differ on long loans. Many take off only this month’s
            payment. Untick “Take it off” for the rest if that is what you follow.
          </p>
        </details>

        <LiabilityForm onSaved={() => router.refresh()} />

        {liabilities.length > 0 && (
          <ul className="divide-y divide-mist border-y border-mist">
            {liabilities.map((l) => {
              if (editingLiabilityId === l.id) {
                return (
                  <li key={l.id} className="space-y-3 py-4">
                    <LiabilityForm
                      liability={l}
                      onSaved={() => {
                        setEditingLiabilityId(null);
                        router.refresh();
                      }}
                      onCancel={() => setEditingLiabilityId(null)}
                    />
                    <button type="button" className="btn-danger" onClick={() => remove("liabilities", l.id, l.label)}>
                      Remove “{l.label}”
                    </button>
                  </li>
                );
              }
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setEditingLiabilityId(l.id)}
                    className="flex min-h-[3.5rem] w-full items-center justify-between gap-4 py-3 text-left transition hover:bg-mist/30"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{l.label}</span>
                      <span className="block text-xs text-sage">{l.deductible ? "Taken off" : "Not taken off"}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className={"font-medium nums " + (l.deductible ? "text-danger" : "text-sage")}>
                        {l.deductible ? "−" : ""}
                        {formatMoney(l.amount, currency)}
                      </span>
                      <span className="text-sm text-pine">Edit</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AssetImport currency={currency} madhhab={madhhab} />
    </div>
  );
}
