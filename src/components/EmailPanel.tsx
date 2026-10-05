"use client";

import { useState } from "react";
import { sendJson } from "@/lib/client-fetch";

export interface EmailState {
  verified: boolean;
  reminders: boolean;
  /** From a confirmation link just followed. */
  status: "confirmed" | "expired" | null;
}

/** Confirm the address, then optionally get hawl reminders by email. */
export default function EmailPanel({ email, state }: { email: string; state: EmailState }) {
  const [sent, setSent] = useState(false);
  const [reminders, setReminders] = useState(state.reminders);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink() {
    setBusy(true);
    setError(null);
    const res = await sendJson("/api/account/email", "POST", undefined, "Could not send the link");
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSent(true);
  }

  async function toggle(next: boolean) {
    // Shown at once; put back if the server refuses.
    setReminders(next);
    setBusy(true);
    setError(null);
    const res = await sendJson(
      "/api/account/email",
      "PUT",
      { reminders: next },
      "Could not save that",
    );
    setBusy(false);
    if (!res.ok) {
      setReminders(!next);
      setError(res.error);
    }
  }

  return (
    <div id="email" className="scroll-mt-20 space-y-3">
      <h3 className="font-serif text-base text-ink">Email</h3>
      {state.status === "confirmed" ? (
        <p className="border border-pine/30 bg-pine/5 px-4 py-3 text-sm text-ink" role="status">
          Your email is confirmed.
        </p>
      ) : null}
      {state.status === "expired" ? (
        <p className="border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
          That confirmation link has expired or was already used. Send a new one below.
        </p>
      ) : null}

      {state.verified ? (
        <>
          <p className="text-sm text-sage">
            {email} is confirmed, so you can reset your password by email.
          </p>
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-pine"
              checked={reminders}
              disabled={busy}
              onChange={(e) => void toggle(e.target.checked)}
            />
            <span>
              Email me a week before my hawl day, and on the day.
              <span className="block text-xs text-sage">
                Reminders carry the date and a link, never amounts.
              </span>
            </span>
          </label>
        </>
      ) : (
        <>
          <p className="text-sm text-sage">
            Confirm {email} to reset your password by email if you forget it, and to
            get hawl reminders if you want them.
          </p>
          {sent ? (
            <p className="text-sm text-ink" role="status">
              Sent. Open the link in that email within 24 hours.
            </p>
          ) : (
            <button type="button" className="btn-ghost" onClick={sendLink} disabled={busy}>
              Send a confirmation link
            </button>
          )}
        </>
      )}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
