"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/client-fetch";
import type { Madhhab } from "@/lib/madhhab";
import { readableDay } from "@/lib/dates";

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
    if (!window.confirm(`Start your zakat year again from ${readableDay(date)}? The year will count from that day.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await sendJson("/api/settings/hawl-restart", "POST", { date }, "Could not start the year again");
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
        className="inline-flex min-h-[44px] items-center text-sm text-pine hover:underline"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Did you drop below the minimum (nisab) during this year?
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm text-sage">
          <p>
            The madhhabs differ here. In the Hanafi madhhab only the start and
            end of the year matter, so a dip in between changes nothing. In the
            Maliki, Shafi&apos;i and Hanbali madhhabs the year starts again from
            the day you are back above the minimum.
            {madhhab === "hanafi"
              ? " You follow the Hanafi madhhab, so you would normally leave it as it is."
              : ""}{" "}
            Ask someone you trust if unsure.
          </p>
          <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label mb-1.5" htmlFor="hawl-restart">
                The day you were back above the minimum
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
              {busy ? "Saving…" : "Start the year again from this day"}
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
