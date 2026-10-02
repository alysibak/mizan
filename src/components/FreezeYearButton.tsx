"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";

export default function FreezeYearButton({
  defaultLabel,
  emphasize = false,
}: {
  defaultLabel: string;
  emphasize?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(emphasize);
  const [label, setLabel] = useState(defaultLabel);
  const [letter, setLetter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function freeze(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await sendJson<{ id: string }>(
      "/api/snapshots",
      "POST",
      {
        label: label.trim() || defaultLabel,
        letterToNextYear: letter.trim() || null,
      },
      "Could not freeze this year",
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const data = res.data;
    try {
      localStorage.removeItem("mizan-forgotten-checked");
    } catch {
      /* ignore */
    }
    router.push(`/year/snapshots/${data.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <div>
        <button
          type="button"
          className={emphasize ? "btn-primary" : "btn-ghost"}
          onClick={() => setOpen(true)}
        >
          Freeze this year’s reckoning
        </button>
        <p className="mt-2 text-xs text-sage">
          Saves today’s figures — and optionally a sealed note for next year’s
          you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={freeze} className="space-y-3 border border-pine/30 bg-pine/5 p-4">
      <p className="font-serif text-lg text-ink">Name this freeze</p>
      <input
        className="field"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={80}
        aria-label="Snapshot label"
      />
      <div>
        <label className="label mb-1.5" htmlFor="letter">
          Letter to next year (optional)
        </label>
        <textarea
          id="letter"
          className="field min-h-[6rem] resize-y"
          maxLength={2000}
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          placeholder="What should next year’s you remember about this reckoning?"
        />
        <p className="mt-1 text-xs text-sage">
          Sealed inside the freeze. You will only see it when you open this
          snapshot.
        </p>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Freezing…" : "Freeze"}
        </button>
        {!emphasize && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
