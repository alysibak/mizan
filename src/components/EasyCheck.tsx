"use client";

import { useRef, useState, type FormEvent } from "react";
import { setStoredValue, useHydrated, useStoredValue } from "@/lib/client-store";
import { IconPuzzled, IconSmile } from "@/components/icons";
import { NOTE_MAX, type FeedbackPage } from "@/lib/feedback";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/en";

const ASKED_KEY = "mizan-asked-easy";

const askedIn = (raw: string | null) => (raw ?? "").split(",").filter(Boolean);

async function post(body: unknown): Promise<{ id?: string } | null> {
  try {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok ? ((await res.json()) as { id?: string }) : null;
  } catch {
    return null;
  }
}

/**
 * "Was this easy?" at the end of a task: two faces to tap, then a line if
 * they want to say more. Asked once per place on a phone. Nothing about the
 * person or their money is sent, only the tap and their words.
 */
export default function EasyCheck({
  page,
  locale,
  m,
}: {
  page: FeedbackPage;
  locale: Locale;
  m: Messages["common"]["easy"];
}) {
  const hydrated = useHydrated();
  const asked = askedIn(useStoredValue(ASKED_KEY));
  const [stage, setStage] = useState<"ask" | "more" | "done">("ask");
  const [easy, setEasy] = useState<boolean | null>(null);
  // The tap's id, once saved: a line typed quickly waits for it.
  const saved = useRef<Promise<string | null>>(Promise.resolve(null));
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  // Nothing on the server, and nothing once this place has been asked.
  if (!hydrated || (stage === "ask" && asked.includes(page))) return null;

  async function answer(value: boolean) {
    setEasy(value);
    setStage("more");
    setStoredValue(ASKED_KEY, [...new Set([...asked, page])].join(","));
    saved.current = post({ page, easy: value, locale }).then((r) => r?.id ?? null);
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    const id = await saved.current;
    if (id && note.trim()) await post({ id, note });
    setSending(false);
    setStage("done");
  }

  return (
    <section aria-label={m.question} className="border border-mist bg-paper/60 p-4" data-easy={page}>
      {stage === "ask" ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className="text-base font-medium text-ink">{m.question}</p>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost gap-2 px-4" onClick={() => answer(true)}>
              <IconSmile className="h-6 w-6 text-pine" />
              {m.yes}
            </button>
            <button type="button" className="btn-ghost gap-2 px-4" onClick={() => answer(false)}>
              <IconPuzzled className="h-6 w-6 text-brassDeep" />
              {m.no}
            </button>
          </div>
        </div>
      ) : stage === "more" ? (
        <form onSubmit={send} className="space-y-2">
          <label htmlFor={`easy-note-${page}`} className="label">
            {easy ? m.askYes : m.askNo}
          </label>
          <textarea
            id={`easy-note-${page}`}
            rows={2}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field min-h-[4.5rem] resize-y"
          />
          <button type="submit" className="btn-primary" disabled={sending}>
            {m.send}
          </button>
        </form>
      ) : (
        <p role="status" className="text-base text-ink">
          {m.thanks}
        </p>
      )}
    </section>
  );
}
