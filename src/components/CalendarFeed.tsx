"use client";

import { useState } from "react";
import { sendJson } from "@/lib/client-fetch";

/** A private calendar subscription for the hawl day, with a reminder. */
export default function CalendarFeed({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    const res = await sendJson<{ url: string }>("/api/account/calendar-feed", "POST", undefined, "Could not make a link");
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setUrl(res.data.url);
    setOn(true);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await sendJson("/api/account/calendar-feed", "DELETE", undefined, "Could not turn it off");
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setUrl(null);
    setOn(false);
  }

  const webcal = url?.replace(/^https?:/, "webcal:");

  return (
    <section className="card space-y-3 p-5">
      <h2 className="font-serif text-lg text-ink">Hawl reminders</h2>
      <p className="text-sm text-sage">
        Subscribe in your phone&apos;s calendar and it will show the reckoning
        day, with a reminder the day before, and follow along when you roll
        the hawl. The link holds only the date, never amounts — but keep it
        private.
      </p>
      {url ? (
        <div className="space-y-2 border border-pine/30 bg-pine/5 p-4">
          <p className="text-sm text-ink">Your link (shown once):</p>
          <p className="select-all break-all font-mono text-xs text-ink">{url}</p>
          <div className="flex flex-wrap gap-2">
            <a href={webcal} className="btn-primary">
              Subscribe on this device
            </a>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => void navigator.clipboard?.writeText(url).catch(() => {})}
            >
              Copy link
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {!url && (
          <button type="button" className="btn-ghost" onClick={create} disabled={busy}>
            {on ? "Make a new link" : "Turn on calendar reminders"}
          </button>
        )}
        {on && (
          <button type="button" className="btn-ghost" onClick={remove} disabled={busy}>
            Turn off
          </button>
        )}
      </div>
      {on && !url ? (
        <p className="text-xs text-sage">
          Reminders are on. A new link stops the old one working.
        </p>
      ) : null}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
