"use client";

import { useState } from "react";
import Link from "next/link";
import { MoneyInput } from "@/components/MoneyInput";
import { parseAmount } from "@/lib/calculator";
import { readStoredValue, setStoredValue } from "@/lib/client-store";
import { formatMoney } from "@/lib/money";
import { PLEDGE_HOLD_DAYS, showPledgeCode } from "@/lib/neighbours";
import { PLEDGES_KEY, keepPledge, parsePledges, writePledges } from "@/lib/neighbours-phone";

/**
 * "I'll give this": how much, and, only if they want, a name and a way to
 * hear it arrived. Then the code and how to pay the mosque. The promise is
 * kept on this phone so the code can be found again.
 */
export default function PledgeBox({
  needId,
  title,
  partner,
  currency,
  room,
  zakat,
}: {
  needId: string;
  title: string;
  partner: string;
  currency: string;
  room: number;
  zakat: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string; amount: number; howToGive: string; contact: string } | null>(null);
  const money = (n: number) => formatMoney(n, currency);
  const value = parseAmount(amount, ".");

  async function promise(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!(value > 0)) {
      setError("Enter how much you will give.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/neighbours/pledges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ needId, amount: value, name, contact }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { code?: string; error?: string } | null;
    if (!res?.ok || !data?.code) {
      setBusy(false);
      setError(data?.error ?? "That did not go through. Please try again.");
      return;
    }
    // How to pay comes from the pledge itself, so it is the mosque's latest.
    const look = await fetch(`/api/neighbours/pledges/${data.code}`).catch(() => null);
    const info = (await look?.json().catch(() => null)) as { partner?: { howToGive?: string; contact?: string } } | null;
    setStoredValue(
      PLEDGES_KEY,
      writePledges(
        keepPledge(parsePledges(readStoredValue(PLEDGES_KEY)), {
          code: data.code,
          needId,
          title,
          partner,
          amount: value,
          currency,
          zakat,
          day: new Date().toISOString().slice(0, 10),
          noted: false,
        }),
      ),
    );
    setDone({ code: data.code, amount: value, howToGive: info?.partner?.howToGive ?? "", contact: info?.partner?.contact ?? "" });
    setBusy(false);
  }

  if (done) {
    return (
      <section aria-labelledby="pay-now" className="space-y-4 border-2 border-pine bg-pine/5 p-5" role="status">
        <h2 id="pay-now" className="font-serif text-2xl text-ink">
          Thank you. Now pay {partner}.
        </h2>
        <p className="text-base text-ink">
          Give {money(done.amount)} to {partner}, and put this code on it so they know it is for this need:
        </p>
        <p className="font-mono text-4xl tracking-widest text-pine" aria-label={`Your code: ${done.code.split("").join(" ")}`}>
          {showPledgeCode(done.code)}
        </p>
        {done.howToGive ? (
          <div>
            <p className="label">How to pay {partner}</p>
            <p className="mt-1 whitespace-pre-line text-base text-ink">{done.howToGive}</p>
          </div>
        ) : null}
        {done.contact ? <p className="text-base text-sage">Questions: {done.contact}</p> : null}
        <p className="text-base text-sage">
          Please pay within {PLEDGE_HOLD_DAYS} days, or your place goes to someone else. The code is kept on this
          phone.
        </p>
        <Link href="/neighbours/mine" className="btn-primary">
          See what I promised
        </Link>
      </section>
    );
  }

  const quick = [room, room >= 40 ? Math.round(room / 2) : 0, room >= 100 ? Math.min(50, room) : 0].filter(
    (n, i, all) => n > 0 && all.indexOf(n) === i,
  );

  return (
    <form onSubmit={promise} aria-labelledby="give-this" className="space-y-4 border-2 border-pine/40 p-5">
      <h2 id="give-this" className="font-serif text-2xl text-ink">
        I’ll give to this
      </h2>
      <p className="text-base text-sage">Still needed: {money(room)}</p>
      <div className="flex flex-wrap gap-2" aria-label="Quick amounts">
        {quick.map((n) => (
          <button key={n} type="button" className="btn-ghost" onClick={() => setAmount(String(n))}>
            {n === room ? `All of it, ${money(n)}` : money(n)}
          </button>
        ))}
      </div>
      <div className="max-w-xs">
        <MoneyInput id="pledge-amount" label="How much will you give?" currency={currency} value={amount} onChange={setAmount} intl="en-CA" />
      </div>
      <details>
        <summary className="text-base font-medium text-pine">Add your name or a way to reach you (optional)</summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label mb-1.5" htmlFor="pledge-name">
              Your name, for the mosque only
            </label>
            <input id="pledge-name" className="field" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label mb-1.5" htmlFor="pledge-contact">
              Email, to hear when it arrives
            </label>
            <input
              id="pledge-contact"
              className="field"
              type="email"
              inputMode="email"
              value={contact}
              maxLength={80}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-sage">Only {partner} sees these, and they are deleted a few weeks after.</p>
      </details>
      {error ? (
        <p role="alert" className="text-base text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full py-3 text-base sm:w-auto" disabled={busy}>
        {busy ? "Saving…" : "I’ll give this"}
      </button>
    </form>
  );
}
