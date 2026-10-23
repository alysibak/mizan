"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PROBLEM_KINDS, PROBLEM_NOTE_MAX, type ProblemKind } from "@/lib/problems";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

/** The form: what kind, what happened, and a way to reply only if they want one. */
export default function ReportProblem({ m, locale }: { m: Messages["common"]["report"]; locale: Locale }) {
  const [kind, setKind] = useState<ProblemKind | null>(null);
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!kind || note.trim().length < 3) return;
    setState("busy");
    const res = await fetch("/api/problems", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, note, contact, page: fromPage(new URLSearchParams(window.location.search).get("from")), locale }),
    }).catch(() => null);
    setState(res?.ok ? "sent" : "error");
  }

  if (state === "sent") {
    return (
      <p role="status" className="border-2 border-pine bg-pine/5 px-5 py-4 text-lg text-ink">
        {m.thanks}
      </p>
    );
  }

  return (
    <form onSubmit={send} className="space-y-5">
      <fieldset>
        <legend className="label">{m.kind}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PROBLEM_KINDS.map((k) => (
            <label
              key={k}
              className={
                "flex min-h-[52px] items-center gap-3 border-2 px-3 text-base text-ink " +
                (kind === k ? "border-pine bg-pine/10" : "border-mist bg-surface")
              }
            >
              <input type="radio" name="problem-kind" checked={kind === k} onChange={() => setKind(k)} />
              {m.kinds[k]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label mb-1.5" htmlFor="problem-note">
          {m.what}
        </label>
        <textarea
          id="problem-note"
          dir="auto"
          className="field min-h-[7rem] resize-y"
          maxLength={PROBLEM_NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <p className="mt-1 text-sm text-sage">{m.privacy}</p>
      </div>
      <Suspense fallback={null}>
        <FromLine label={m.where} />
      </Suspense>
      <div>
        <label className="label mb-1.5" htmlFor="problem-contact">
          {m.contact}
        </label>
        <input id="problem-contact" dir="auto" className="field" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} />
      </div>
      {state === "error" ? (
        <p role="alert" className="text-base text-danger">
          {m.error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full py-3 text-base sm:w-auto" disabled={!kind || note.trim().length < 3 || state === "busy"}>
        {m.send}
      </button>
    </form>
  );
}

/** The page they came from, so the report says where it happened: a path on this site only. */
function fromPage(from: string | null): string {
  return from && from.startsWith("/") && !from.startsWith("//") ? from : "";
}

function FromLine({ label }: { label: string }) {
  const page = fromPage(useSearchParams().get("from"));
  return page ? (
    <p className="text-sm text-sage">
      {label}: <span dir="ltr" className="font-mono">{page}</span>
    </p>
  ) : null;
}
