"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";
import { setStoredValue } from "@/lib/client-store";

/**
 * Keep a copy of the year. Once the zakat day has come, the same tap also
 * starts counting the next year, so closing a year is one thing to do.
 */
export default function FreezeYearButton({
  defaultLabel,
  emphasize = false,
  nextStart = null,
}: {
  defaultLabel: string;
  emphasize?: boolean;
  /** The day the next zakat year starts, when this one can be closed now. */
  nextStart?: string | null;
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
      "Could not keep a copy of this year",
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const data = res.data;
    // A new year starts the forgotten-wealth checklist fresh.
    setStoredValue("mizan-forgotten-checked", null);
    if (nextStart) {
      const rolled = await fetch("/api/settings/roll-hawl", { method: "POST" }).catch(() => null);
      if (rolled?.ok) {
        router.push(`/year?rolled=${encodeURIComponent(nextStart)}`);
        router.refresh();
        return;
      }
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
          {nextStart ? "Close this year" : "Keep a copy of this year"}
        </button>
        <p className="mt-2 text-xs text-sage">
          {nextStart
            ? `Keeps a copy of this year’s figures and starts counting the next year from ${nextStart}.`
            : "Saves today’s figures, with a note to yourself for next year if you like."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={freeze} className="space-y-3 border border-pine/30 bg-pine/5 p-4">
      <p className="font-serif text-lg text-ink">Name this copy</p>
      <input
        className="field"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={80}
        aria-label="Name of this copy"
      />
      <div>
        <label className="label mb-1.5" htmlFor="letter">
          A note to yourself for next year (optional)
        </label>
        <textarea
          id="letter"
          className="field min-h-[6rem] resize-y"
          maxLength={2000}
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          placeholder="What should you remember next year?"
        />
        <p className="mt-1 text-xs text-sage">
          Kept with this copy, and shown on your Home page until you put it away.
        </p>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : nextStart ? "Close the year" : "Keep the copy"}
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
