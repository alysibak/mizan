"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";
import type { Madhhab } from "@/lib/madhhab";

/**
 * Wealth dipped below nisab during the year. Whether that restarts the hawl
 * is a known school difference, so the choice is the user's to make.
 */
export default function HawlRestart({
  madhhab,
  hawlStart,
  today,
}: {
  madhhab: Madhhab;
  hawlStart: string;
  /** The user's own calendar day, YYYY-MM-DD. */
  today: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm(`Restart the hawl from ${date}? The year will count again from that day.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await sendJson("/api/settings/hawl-restart", "POST", { date }, "Could not restart the hawl");
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mt-5 border-t border-mist pt-4">
      <button
        type="button"
        className="text-sm text-pine hover:underline"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Did your wealth fall below nisab during this hawl?
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm text-sage">
          <p>
            Schools differ here. In the Hanafi school only the start and end of
            the year matter, so a dip in between does not restart the hawl. In
            the Maliki, Shafi&apos;i, and Hanbali schools the hawl breaks and
            starts again from the day wealth is back at nisab.
            {madhhab === "hanafi"
              ? " Your profile is Hanafi, so you would normally leave the hawl as it is."
              : ""}{" "}
            Ask someone you trust if unsure.
          </p>
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label mb-1.5" htmlFor="hawl-restart">
                Day wealth was back at nisab
              </label>
              <input
                id="hawl-restart"
                type="date"
                className="field"
                min={hawlStart}
                max={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-ghost" disabled={busy || !date}>
              {busy ? "Saving…" : "Restart hawl from this day"}
            </button>
          </form>
          {error && (
            <p className="text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
