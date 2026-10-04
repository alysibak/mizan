"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Advance ledger hawl start to the tabular due day of the closed cycle. */
export default function RollHawlButton({
  nextStart,
}: {
  /** The current hawl's tabular due day, which becomes the next start. */
  nextStart: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const res = await fetch("/api/settings/roll-hawl", { method: "POST" }).catch(
      () => null,
    );
    setBusy(false);
    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error || "Could not roll hawl");
      return;
    }
    // This snapshot stops being the current cycle's once rolled, so the
    // confirmation lives on The year rather than in this button's state.
    router.push(`/year?rolled=${encodeURIComponent(nextStart)}`);
    router.refresh();
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
