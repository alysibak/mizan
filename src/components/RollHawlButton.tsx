"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hawlDueDate } from "@/lib/hijri";
import type { Settings } from "@/db/schema";

/** Advance ledger hawl start to the tabular due day of the closed cycle. */
export default function RollHawlButton({
  settings,
}: {
  settings: Settings;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!settings.hawlStartDate) {
    return (
      <p className="text-sm text-sage">
        Set a hawl start in settings before rolling the next cycle.
      </p>
    );
  }

  const nextStart = hawlDueDate(settings.hawlStartDate)
    .toISOString()
    .slice(0, 10);

  async function roll() {
    if (
      !window.confirm(
        `Start the next hawl on ${nextStart}? (tabular due day of the cycle you just closed)`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency: settings.currency,
        nisabStandard: settings.nisabStandard,
        calendarBasis: settings.calendarBasis,
        goldPricePerGram: settings.goldPricePerGram,
        silverPricePerGram: settings.silverPricePerGram,
        hawlStartDate: nextStart,
        madhhab: settings.madhhab,
        setupComplete: settings.setupComplete,
        trustedAckAt: settings.trustedAckAt,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not roll hawl");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div>
        <p className="text-sm text-gain">
          Next hawl starts {nextStart}. Confirm the real payment day with local
          moon-sighting.
        </p>
        <Link href="/statement" className="btn-primary mt-4 inline-flex">
          Print statement
        </Link>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="btn-primary"
        disabled={busy}
        onClick={roll}
      >
        {busy ? "Saving…" : `Roll hawl to ${nextStart}`}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <p className="mt-2 text-xs text-sage">
        Sets the ledger hawl start to this cycle’s tabular due day so the next
        year begins counting.
      </p>
    </div>
  );
}
