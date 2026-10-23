"use client";

import { useState } from "react";
import { REPORT_REASONS, type ReportReason } from "@/lib/neighbours";

/** "Something wrong with this?": goes to the mosque, and enough reports take it off the list. */
export default function ReportNeed({ needId }: { needId: string }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setState("busy");
    const res = await fetch("/api/neighbours/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ needId, reason, note }),
    }).catch(() => null);
    setState(res?.ok ? "sent" : "error");
  }

  return (
    <details className="border-t border-mist pt-2">
      <summary className="text-base text-sage">Something wrong with this?</summary>
      {state === "sent" ? (
        <p role="status" className="mt-2 text-base text-ink">
          Thank you. The mosque will look at it.
        </p>
      ) : (
        <form onSubmit={send} className="mt-2 space-y-3">
          <fieldset>
            <legend className="label">What is wrong?</legend>
            <div className="mt-2 space-y-1">
              {REPORT_REASONS.map((r) => (
                <label key={r.key} className="flex min-h-[44px] items-center gap-3 text-base text-ink">
                  <input type="radio" name="report-reason" checked={reason === r.key} onChange={() => setReason(r.key)} />
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label mb-1.5" htmlFor="report-note">
              Anything to add (optional)
            </label>
            <textarea
              id="report-note"
              className="field min-h-[4.5rem] resize-y"
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {state === "error" ? (
            <p role="alert" className="text-base text-danger">
              That did not go through. Please try again.
            </p>
          ) : null}
          <button type="submit" className="btn-ghost" disabled={!reason || state === "busy"}>
            Send to the mosque
          </button>
        </form>
      )}
    </details>
  );
}
