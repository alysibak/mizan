"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";
import { track } from "@/lib/analytics";

/** One click into the shared read-only demo ledger. */
export default function DemoButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enter() {
    setBusy(true);
    setError(null);
    const res = await sendJson("/api/auth/demo", "POST", undefined, "The demo is unavailable.");
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    track("Demo");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void enter()}
        disabled={busy}
        className={className ?? "btn-ghost w-full justify-center py-2.5"}
      >
        {busy ? "Opening the demo…" : "Explore a demo ledger"}
      </button>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
