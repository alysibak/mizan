"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";

type RestoreCounts = {
  assets: number;
  liabilities: number;
  giving: number;
  snapshots?: number;
};

export default function DataBackup() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function restore(file: File) {
    if (
      !window.confirm(
        "This replaces your assets, debts, giving, and settings with the file. Continue?",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    let payload: unknown;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      setError("That file is not valid JSON.");
      setBusy(false);
      return;
    }
    const res = await sendJson<RestoreCounts>(
      "/api/import",
      "POST",
      payload,
      "Could not restore this file",
    );
    setBusy(false);
    if (!res.ok) {
      setError(`${res.error} Your existing data was not changed.`);
      return;
    }
    const d = res.data;
    setMessage(
      `Restored ${d.assets} assets, ${d.liabilities} debts, ${d.giving} gifts${
        d.snapshots != null ? `, ${d.snapshots} snapshots` : ""
      }.`,
    );
    router.refresh();
  }

  return (
    <section className="card p-5">
      <h2 className="font-serif text-lg text-ink">Take this ledger with you</h2>
      <p className="mt-1 text-sm text-sage">
        A JSON file of your settings, assets, debts, giving, and frozen years.
        Keep a copy on a drive you control. Nothing here depends on this website
        staying up.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href="/api/export" className="btn-primary" download>
          Download backup
        </a>
        <label className="btn-ghost cursor-pointer">
          Restore from file
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void restore(file);
            }}
          />
        </label>
      </div>
      {message && <p className="mt-3 text-sm text-gain">{message}</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </section>
  );
}
