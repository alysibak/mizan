"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";
import { setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import {
  CALC_STORAGE_KEY,
  decimalMarkFor,
  draftIsEmpty,
  draftToLedger,
  parseDraft,
} from "@/lib/calculator";
import { MY_KEY, parseMy } from "@/lib/my-zakat";
import { formatMoney } from "@/lib/money";

function dayText(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** What the public pages kept on this phone, as rows the ledger can take. */
function usePhoneFigures() {
  const draftRaw = useStoredValue(CALC_STORAGE_KEY);
  const myRaw = useStoredValue(MY_KEY);
  const stored = parseDraft(draftRaw);
  const draft = stored && !stored.decimal ? { ...stored, decimal: decimalMarkFor(navigator.language) } : stored;
  const ledger = draft && !draftIsEmpty(draft) ? draftToLedger(draft) : null;
  const payments = parseMy(myRaw).payments;
  return { ledger, payments, currency: draft?.currency ?? null, any: Boolean(ledger) || payments.length > 0 };
}

/**
 * The dashboard's one line: figures worked out on the public pages are
 * waiting on this phone, and the holdings page can bring them in.
 */
export function FromThisPhoneNotice() {
  const hydrated = useHydrated();
  const { any } = usePhoneFigures();
  if (!hydrated || !any) return null;
  return (
    <Link
      href="/assets#from-phone"
      className="flex items-center justify-between gap-3 border border-pine/40 bg-pine/5 px-4 py-3 text-sm font-medium text-pine transition hover:border-pine"
    >
      <span>You have figures on this phone from the calculator or My zakat. Add them to your ledger.</span>
      <span aria-hidden>→</span>
    </Link>
  );
}

/**
 * Figures worked out on the public pages, offered to someone already signed
 * in. They sit above what the ledger holds, so the visitor can see what is
 * already there and tick only what is new.
 */
export default function FromThisPhone({ currency }: { currency: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const phone = usePhoneFigures();
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // Steps already sent, so trying again after a failure adds nothing twice.
  const [sent, setSent] = useState({ assets: false, debts: 0, payments: 0 });

  if (!hydrated) return null;
  if (done) {
    return (
      <p className="border border-pine/40 bg-pine/5 px-4 py-3 text-sm font-medium text-pine" role="status">
        Added. You will find them in the list below.
      </p>
    );
  }
  if (!phone.any) return null;

  const { ledger, payments } = phone;
  const sameCurrency = phone.currency === null || phone.currency === currency;
  const money = (n: number) => formatMoney(n, phone.currency ?? currency);
  const rows = [
    ...(ledger?.assets ?? []).map((a, i) => ({ key: `a${i}`, label: a.label, amount: a.amount * a.zakatablePortion, kind: "asset" as const })),
    ...(ledger?.liabilities ?? []).map((d, i) => ({ key: `d${i}`, label: d.label, amount: -d.amount, kind: "debt" as const })),
    ...payments.map((p) => ({
      key: p.id,
      label: `Zakat given ${p.to ? `to ${p.to} ` : ""}on ${dayText(p.day)}`,
      amount: p.amount,
      kind: "payment" as const,
    })),
  ];
  const ticked = rows.filter((r) => !skipped.has(r.key));

  function toggle(key: string) {
    setSkipped((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const assets = (ledger?.assets ?? []).filter((_, i) => !skipped.has(`a${i}`));
      if (assets.length && !sent.assets) {
        const res = await sendJson("/api/assets/import", "POST", { rows: assets }, "Could not add your holdings");
        if (!res.ok) throw new Error(res.error);
        setSent((s) => ({ ...s, assets: true }));
      }
      const debts = (ledger?.liabilities ?? []).filter((_, i) => !skipped.has(`d${i}`));
      for (const [i, debt] of debts.entries()) {
        if (i < sent.debts) continue;
        const res = await sendJson("/api/liabilities", "POST", debt, "Could not add your debts");
        if (!res.ok) throw new Error(res.error);
        setSent((s) => ({ ...s, debts: i + 1 }));
      }
      const given = payments.filter((p) => !skipped.has(p.id));
      for (const [i, p] of given.entries()) {
        if (i < sent.payments) continue;
        const res = await sendJson(
          "/api/giving",
          "POST",
          { amount: p.amount, type: "zakat", recipient: p.to || null, date: p.day },
          "Could not add what you have given",
        );
        if (!res.ok) throw new Error(res.error);
        setSent((s) => ({ ...s, payments: i + 1 }));
      }
      // The ledger keeps them now; the zakat day and past years stay on the phone.
      setStoredValue(CALC_STORAGE_KEY, null);
      if (payments.length) {
        setStoredValue(MY_KEY, JSON.stringify({ ...parseMy(localStorage.getItem(MY_KEY)), payments: [] }));
      }
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  function forget() {
    if (!window.confirm("Remove these figures from this phone? Your ledger is not changed.")) return;
    setStoredValue(CALC_STORAGE_KEY, null);
    if (payments.length) {
      setStoredValue(MY_KEY, JSON.stringify({ ...parseMy(localStorage.getItem(MY_KEY)), payments: [] }));
    }
  }

  return (
    <section id="from-phone" className="card scroll-mt-24 border-pine/50 p-5" aria-labelledby="from-phone-title">
      <h2 id="from-phone-title" className="font-serif text-xl text-ink">
        From this phone
      </h2>
      <p className="mt-1 text-sm text-sage">
        You worked these out on the calculator or noted them in My zakat. Untick anything your ledger already has, then
        add the rest.
      </p>
      <ul className="mt-3 divide-y divide-mist/70 border-y border-mist/70">
        {rows.map((r) => (
          <li key={r.key}>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 py-2 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 accent-pine"
                checked={!skipped.has(r.key)}
                onChange={() => toggle(r.key)}
                disabled={busy || !sameCurrency}
              />
              <span className="flex-1 text-ink">{r.label}</span>
              <span className={(r.amount < 0 ? "text-danger" : r.kind === "payment" ? "text-pine" : "text-ink") + " nums"}>
                {r.amount < 0 ? `−${money(-r.amount)}` : money(r.amount)}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {sameCurrency ? null : (
        <p className="mt-3 text-sm text-warn">
          These are in {phone.currency}, and your ledger counts in {currency}. Open the{" "}
          <Link href="/calculator" className="font-medium underline">
            calculator
          </Link>
          , choose {currency}, and check the amounts first.
        </p>
      )}
      {error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={() => void add()}
          disabled={busy || !sameCurrency || ticked.length === 0}
        >
          {busy ? "Adding…" : ticked.length === rows.length ? "Add them to my ledger" : `Add the ${ticked.length} ticked`}
        </button>
        <button type="button" className="btn-ghost" onClick={forget} disabled={busy}>
          Remove from this phone
        </button>
      </div>
    </section>
  );
}
