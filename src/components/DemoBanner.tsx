"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";

/** Shown on every page while signed into the shared, read-only demo. */
export default function DemoBanner() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Signed-in visitors are sent away from /register, so leave the demo first.
  async function startOwn() {
    setBusy(true);
    await sendJson("/api/auth/logout", "POST");
    router.push("/register");
    router.refresh();
  }

  return (
    <div
      role="note"
      className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-brass/40 bg-brass/10 px-4 py-3 text-sm print:hidden"
    >
      <p className="text-ink">
        <span className="font-medium">You are exploring the demo.</span>{" "}
        <span className="text-sage">Look around freely; changes are not saved.</span>
      </p>
      <button
        type="button"
        onClick={() => void startOwn()}
        disabled={busy}
        className="btn-primary px-3 py-1.5 text-sm"
      >
        {busy ? "One moment…" : "Start your own ledger"}
      </button>
    </div>
  );
}
