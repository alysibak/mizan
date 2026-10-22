"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { ASNAF, asnafLabel } from "@/lib/asnaf";
import { givingTypeLabel, type GivingType } from "@/lib/giving";
import { localIsoDay } from "@/lib/dates";
import { sendJson } from "@/lib/client-fetch";
import { useHydrated } from "@/lib/client-store";
import type { GivingRecord } from "@/db/schema";

const TYPE_TONE: Record<string, string> = {
  zakat: "text-pine",
  purification: "text-sage",
  fitr: "text-ink",
  sadaqah: "text-brassDeep",
};

export default function GivingManager({
  records,
  currency,
  defaultType = "zakat",
  defaultAmount,
  defaultAsnaf,
  cycleOutstanding = 0,
  cyclePayable = false,
  cleared = false,
}: {
  records: GivingRecord[];
  currency: string;
  defaultType?: GivingType;
  defaultAmount?: number;
  defaultAsnaf?: string | null;
  cycleOutstanding?: number;
  cyclePayable?: boolean;
  /** The last gift just covered the cycle (carried in the URL as ?cleared=1). */
  cleared?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCleared, setJustCleared] = useState(cleared);
  const [type, setType] = useState<GivingType>(defaultType);
  // The viewer's own calendar day, set after mount so the server render (UTC)
  // never pre-fills tomorrow's date for someone west of Greenwich.
  const hydrated = useHydrated();
  const [pickedDate, setDate] = useState<string | null>(null);
  const date = pickedDate ?? (hydrated ? localIsoDay() : "");

  const recipients = [
    ...new Set(records.map((r) => r.recipient).filter((x): x is string => Boolean(x))),
  ];

  async function addRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    setJustCleared(false);
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const amount = Number(form.get("amount"));
    const giftType = String(form.get("type"));
    const asnafRaw = String(form.get("asnaf") || "");
    const res = await sendJson(
      "/api/giving",
      "POST",
      {
        amount: form.get("amount"),
        type: giftType,
        asnaf: giftType === "zakat" && asnafRaw ? asnafRaw : null,
        recipient: form.get("recipient"),
        note: form.get("note"),
        date: form.get("date"),
      },
      "Could not record this gift",
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const clearedCycle =
      giftType === "zakat" &&
      cyclePayable &&
      cycleOutstanding > 0 &&
      amount >= cycleOutstanding - 0.005;
    formEl.reset();
    setType(defaultType);
    setDate(null);
    // The page remounts this form when the prefilled amount leaves the URL,
    // so the "cycle cleared" note travels in the URL too.
    const params = new URLSearchParams();
    if (defaultType !== "zakat") params.set("type", defaultType);
    if (clearedCycle) params.set("cleared", "1");
    const q = params.size ? `/giving?${params}` : "/giving";
    setJustCleared(clearedCycle);
    router.replace(q, { scroll: !clearedCycle });
    router.refresh();
  }

  async function removeRecord(id: string, label: string) {
    if (!window.confirm(`Remove this gift (${label})?`)) return;
    setError(null);
    const res = await sendJson(`/api/giving/${id}`, "DELETE", undefined, "Could not remove this gift");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {justCleared && (
        <section className="border border-pine/40 bg-pine/5 px-5 py-5">
          <p className="label text-pine">All given</p>
          <p className="mt-1 font-serif text-xl text-ink">
            That covers all of this year’s zakat. May Allah accept it from you.
          </p>
          <p className="mt-1 text-sm text-sage">
            Now close the year: Mizan keeps a copy and starts counting the next one.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href="/year#freeze-year" className="btn-primary">
              Close this year
            </Link>
            <button
              type="button"
              className="text-xs text-sage hover:text-ink"
              onClick={() => setJustCleared(false)}
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {cyclePayable && cycleOutstanding > 0 && !justCleared && (
        <section className="border border-mist px-5 py-4">
          <p className="text-sm text-sage">
            Still{" "}
            <span className="nums text-ink">
              {formatMoney(cycleOutstanding, currency)}
            </span>{" "}
            of this year’s zakat still to give.
          </p>
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Note what you gave</h2>
        <form onSubmit={addRecord} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label mb-1.5" htmlFor="amount">
                Amount ({currency})
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                className="field nums"
                placeholder="0.00"
                defaultValue={defaultAmount ?? ""}
                required
              />
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="type">
                What it was
              </label>
              <select
                id="type"
                name="type"
                className="field"
                value={type}
                onChange={(e) => setType(e.target.value as GivingType)}
              >
                <option value="zakat">Zakat (the yearly 2.5%)</option>
                <option value="fitr">Zakat al-Fitr (before Eid)</option>
                <option value="purification">Interest given away</option>
                {/* Never needed: kept for anyone who still wants to note it. */}
                <option value="sadaqah">Sadaqah (no need to note it)</option>
              </select>
            </div>
            <div>
              <label className="label mb-1.5" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="field"
                required
              />
            </div>
          </div>

          {type === "fitr" && (
            <p className="text-xs text-sage">
              Zakat al-Fitr is separate. It does not count toward this year’s
              zakat.{" "}
              <Link href="/zakat-al-fitr" className="text-pine hover:underline">
                Work out the amount
              </Link>
              .
            </p>
          )}

          <details open={defaultAsnaf ? true : undefined}>
            <summary className="cursor-pointer text-sm text-pine hover:underline">
              Add who it went to, or a note (optional)
            </summary>
            <div className="mt-3 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label mb-1.5" htmlFor="recipient">
                    Who it went to
                  </label>
                  <input
                    id="recipient"
                    name="recipient"
                    className="field"
                    placeholder="e.g. Local mosque"
                    list="past-recipients"
                    maxLength={120}
                  />
                  {recipients.length > 0 && (
                    <datalist id="past-recipients">
                      {recipients.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  )}
                </div>
                <div>
                  <label className="label mb-1.5" htmlFor="note">
                    Note
                  </label>
                  <input
                    id="note"
                    name="note"
                    className="field"
                    placeholder="e.g. Ramadan"
                    maxLength={400}
                  />
                </div>
              </div>
              {type === "zakat" && (
                <div>
                  <label className="label mb-1.5" htmlFor="asnaf">
                    Which group it went to
                  </label>
                  <select
                    id="asnaf"
                    name="asnaf"
                    className="field"
                    defaultValue={defaultAsnaf ?? ""}
                  >
                    <option value="">Not saying</option>
                    {ASNAF.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-sage">
                    The eight groups the Quran names, for your own record.{" "}
                    <Link href="/who-can-receive" className="text-pine underline">
                      See the groups
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </details>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Saving…" : "Save it"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg text-ink">
          History{" "}
          <span className="text-sm font-normal text-sage">({records.length})</span>
        </h2>
        {records.length === 0 ? (
          <p className="card p-5 text-sm text-sage">
            Nothing noted yet. What you note shows here, newest first.
          </p>
        ) : (
          <ul className="divide-y divide-mist overflow-hidden card">
            {records.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    {r.recipient || givingTypeLabel(r.type)}
                  </p>
                  <p className="text-xs text-sage">
                    {r.date}
                    {r.asnaf ? ` · ${asnafLabel(r.asnaf)}` : ""}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-ink nums">
                      {formatMoney(r.amount, currency)}
                    </p>
                    <p className={"text-xs " + (TYPE_TONE[r.type] ?? "text-brassDeep")}>
                      {givingTypeLabel(r.type)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      removeRecord(r.id, formatMoney(r.amount, currency))
                    }
                    className="-m-2 p-2 text-lg leading-none text-sage transition hover:text-danger"
                    aria-label={`Remove ${givingTypeLabel(r.type)} of ${formatMoney(r.amount, currency)} on ${r.date}`}
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
