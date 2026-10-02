"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { ASNAF, asnafLabel } from "@/lib/asnaf";
import { givingTypeLabel, type GivingType } from "@/lib/giving";
import { localIsoDay } from "@/lib/dates";
import { sendJson } from "@/lib/client-fetch";
import type { GivingRecord } from "@/db/schema";

const TYPE_TONE: Record<string, string> = {
  zakat: "text-pine",
  purification: "text-sage",
  fitr: "text-ink",
  sadaqah: "text-brass",
};

export default function GivingManager({
  records,
  currency,
  defaultType = "sadaqah",
  defaultAmount,
  defaultAsnaf,
  cycleOutstanding = 0,
  cyclePayable = false,
}: {
  records: GivingRecord[];
  currency: string;
  defaultType?: GivingType;
  defaultAmount?: number;
  defaultAsnaf?: string | null;
  cycleOutstanding?: number;
  cyclePayable?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCleared, setJustCleared] = useState(false);
  const [type, setType] = useState<GivingType>(defaultType);
  // The viewer's own calendar day, set after mount so the server render (UTC)
  // never pre-fills tomorrow's date for someone west of Greenwich.
  const [date, setDate] = useState("");
  useEffect(() => setDate((d) => d || localIsoDay()), []);

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
    if (
      giftType === "zakat" &&
      cyclePayable &&
      cycleOutstanding > 0 &&
      amount >= cycleOutstanding - 0.005
    ) {
      setJustCleared(true);
    }
    formEl.reset();
    setType(defaultType);
    setDate(localIsoDay());
    const q = defaultType === "sadaqah" ? "/giving" : `/giving?type=${defaultType}`;
    router.replace(q);
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
          <p className="label text-pine">Cycle cleared</p>
          <p className="mt-1 font-serif text-xl text-ink">
            That payment covers this cycle’s outstanding zakat.
          </p>
          <p className="mt-1 text-sm text-sage">
            Next: freeze → roll the ledger hawl → print statement.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/year#freeze-year" className="btn-primary">
              Freeze on The year
            </Link>
            <Link href="/statement" className="btn-ghost">
              Print statement
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
            zakat outstanding this cycle. After you pay, freeze on The year.
          </p>
          <Link
            href="/year#freeze-year"
            className="mt-2 inline-block text-sm text-pine hover:underline"
          >
            Open freeze step
          </Link>
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-serif text-lg text-ink">Record a gift</h2>
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
                Type
              </label>
              <select
                id="type"
                name="type"
                className="field"
                value={type}
                onChange={(e) => setType(e.target.value as GivingType)}
              >
                <option value="sadaqah">Sadaqah (voluntary)</option>
                <option value="zakat">Zakat (obligatory, on wealth)</option>
                <option value="fitr">Zakat al-Fitr (end of Ramadan)</option>
                <option value="purification">Purification / interest</option>
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

          {type === "zakat" && (
            <div>
              <label className="label mb-1.5" htmlFor="asnaf">
                Recipient category (optional)
              </label>
              <select
                id="asnaf"
                name="asnaf"
                className="field"
                defaultValue={defaultAsnaf ?? ""}
              >
                <option value="">Not specified</option>
                {ASNAF.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-sage">
                The eight asnaf from the Qur’an — for your record, not a ruling
                on who qualifies.{" "}
                <Link href="/tools/asnaf" className="text-pine hover:underline">
                  Read the list
                </Link>
                .
              </p>
            </div>
          )}

          {type === "fitr" && (
            <p className="text-xs text-sage">
              Zakat al-Fitr is its own obligation. It does not count toward zakat
              on wealth for this cycle.{" "}
              <Link href="/tools/fitr" className="text-pine hover:underline">
                Work out the amount
              </Link>
              .
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label mb-1.5" htmlFor="recipient">
                Recipient (optional)
              </label>
              <input
                id="recipient"
                name="recipient"
                className="field"
                placeholder="e.g. local food bank"
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
                Note (optional)
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

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Recording…" : "Record gift"}
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
            Nothing recorded yet. Your giving will appear here, newest first.
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
                    <p className={"text-xs " + (TYPE_TONE[r.type] ?? "text-brass")}>
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
