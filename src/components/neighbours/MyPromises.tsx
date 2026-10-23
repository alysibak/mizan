"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readStoredValue, setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import { formatMoney } from "@/lib/money";
import { showPledgeCode } from "@/lib/neighbours";
import { PLEDGES_KEY, forgetPledge, markNoted, parsePledges, writePledges, type KeptPledge } from "@/lib/neighbours-phone";
import { MY_KEY, addPayment, parseMy } from "@/lib/my-zakat";

interface Status {
  status: "pledged" | "received" | "lapsed" | "cancelled";
  received: number | null;
  receivedAt: string | null;
  need: { thanks: string | null };
  partner: { howToGive: string; contact: string };
}

const WORDS: Record<Status["status"], string> = {
  pledged: "Waiting for your payment",
  received: "It arrived. May Allah reward you.",
  lapsed: "Nothing arrived in time, so the place went to someone else",
  cancelled: "Cancelled by the mosque",
};

/**
 * Each promise with its code and where it stands, checked with the mosque's
 * desk. Once a zakat promise arrives it can be noted in My zakat, once.
 */
export default function MyPromises() {
  const hydrated = useHydrated();
  const raw = useStoredValue(PLEDGES_KEY);
  const list = parsePledges(raw);
  const [statuses, setStatuses] = useState<Record<string, Status | "unknown">>({});
  const codes = list.map((p) => p.code).join(",");

  useEffect(() => {
    if (!codes) return;
    let cancelled = false;
    Promise.all(
      codes.split(",").map(async (code) => {
        const res = await fetch(`/api/neighbours/pledges/${code}`).catch(() => null);
        const data = res?.ok ? ((await res.json().catch(() => null)) as Status | null) : null;
        return [code, data ?? "unknown"] as const;
      }),
    ).then((pairs) => {
      if (!cancelled) setStatuses(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [codes]);

  if (!hydrated) return null;
  if (!list.length) {
    return (
      <p className="border border-dashed border-mist px-5 py-8 text-center text-base text-sage">
        Nothing promised on this phone yet.{" "}
        <Link href="/neighbours" className="text-pine underline underline-offset-2">
          See the needs near you
        </Link>
        .
      </p>
    );
  }

  function save(next: KeptPledge[]) {
    setStoredValue(PLEDGES_KEY, writePledges(next));
  }

  function noteInMyZakat(p: KeptPledge, s: Status) {
    const my = parseMy(readStoredValue(MY_KEY));
    const day = (s.receivedAt ?? new Date().toISOString()).slice(0, 10);
    setStoredValue(MY_KEY, JSON.stringify(addPayment(my, { day, amount: s.received ?? p.amount, to: p.partner })));
    save(markNoted(list, p.code));
  }

  return (
    <ul className="space-y-4">
      {[...list].reverse().map((p) => {
        const s = statuses[p.code];
        const known = s && s !== "unknown" ? s : null;
        return (
          <li key={p.code} className="space-y-2 border-2 border-mist p-4" data-code={p.code}>
            <Link href={`/neighbours/${p.needId}`} className="font-serif text-lg text-ink hover:underline">
              {p.title}
            </Link>
            <p className="text-base text-sage">
              {formatMoney(p.amount, p.currency)} to {p.partner} · code{" "}
              <span className="font-mono text-ink">{showPledgeCode(p.code)}</span>
            </p>
            <p className={"text-base font-medium " + (known?.status === "received" ? "text-pine" : "text-ink")} aria-live="polite">
              {known ? WORDS[known.status] : s === "unknown" ? "Could not check just now" : "Checking…"}
            </p>
            {known?.status === "received" && known.need.thanks ? (
              <blockquote className="border-s-4 border-brass bg-brass/5 px-3 py-2 text-base text-ink">
                {known.need.thanks}
              </blockquote>
            ) : null}
            {known?.status === "pledged" && known.partner.howToGive ? (
              <details>
                <summary className="text-base text-pine">How to pay {p.partner}</summary>
                <p className="whitespace-pre-line pb-2 text-base text-ink">{known.partner.howToGive}</p>
              </details>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {known?.status === "received" && p.zakat && !p.noted ? (
                <button type="button" className="btn-primary" onClick={() => noteInMyZakat(p, known)}>
                  Count it as zakat given
                </button>
              ) : null}
              {p.noted ? <span className="text-base text-sage">Counted in My zakat</span> : null}
              {known && known.status !== "pledged" ? (
                <button type="button" className="btn-ghost" onClick={() => save(forgetPledge(list, p.code))}>
                  Remove from this phone
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
