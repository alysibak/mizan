"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ANSWER_ICONS } from "@/components/public/answerIcons";
import { IconCheckCircle } from "@/components/icons";

export interface QuizRound {
  key: string;
  /** "Do I pay zakat on…" or "Can I give zakat to…". */
  prompt: string;
  label: string;
  /** Whether "Yes" is the right answer. */
  yes: boolean;
  verdict: string;
  answer: string;
  /** Where the full answer is. */
  href: string;
}

const PRAISE: { from: number; text: string }[] = [
  { from: 10, text: "Every one right. You know this well." },
  { from: 8, text: "Very good. Read the one or two you missed, and you have it." },
  { from: 5, text: "A good start. The answers below explain the rest." },
  { from: 0, text: "Everyone starts somewhere. Read the answers below, then try again." },
];

/**
 * Ten picture questions, one at a time: tap Yes or No, see at once whether
 * it was right and why, and a score at the end. The questions and answers
 * are the ones on "Do I pay zakat on…?" and "Can I give zakat to…?".
 */
export default function QuizGame({ rounds }: { rounds: QuizRound[] }) {
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<boolean[]>([]);
  const next = useRef<HTMLButtonElement>(null);
  const done = at >= rounds.length;
  const round = rounds[Math.min(at, rounds.length - 1)];
  const picked = picks.length > at ? picks[at] : null;
  const score = picks.filter((p, i) => p === rounds[i].yes).length;

  // Keyboard and screen-reader users land on "Next" once they have answered.
  useEffect(() => {
    if (picked !== null) next.current?.focus();
  }, [picked]);

  if (done) {
    const praise = PRAISE.find((p) => score >= p.from)!.text;
    const missed = rounds.filter((r, i) => picks[i] !== r.yes);
    return (
      <section className="card space-y-5 p-5 text-center sm:p-8" aria-labelledby="quiz-score">
        <p className="label text-brassDeep">Your score</p>
        <h2 id="quiz-score" className="font-serif text-5xl text-pine nums">
          {score} of {rounds.length}
        </h2>
        <p className="flex justify-center gap-1" aria-hidden>
          {rounds.map((r, i) => (
            <span
              key={r.key}
              className={"h-3 w-3 rounded-full " + (picks[i] === r.yes ? "bg-pine" : "border border-brass bg-transparent")}
            />
          ))}
        </p>
        <p className="text-lg text-ink">{praise}</p>
        {missed.length ? (
          <ul className="space-y-2 text-start">
            {missed.map((r) => (
              <li key={r.key} className="border-s-2 border-brass ps-3 text-sm">
                <span className="block text-sage">
                  {r.prompt} {r.label.charAt(0).toLowerCase() + r.label.slice(1)}?
                </span>
                <Link href={r.href} className="font-medium text-pine hover:underline">
                  {r.verdict}: read why
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="btn-primary px-5 py-3 text-base"
            onClick={() => {
              setPicks([]);
              setAt(0);
            }}
          >
            Play again
          </button>
          <Link href="/guide" className="btn-ghost px-5 py-3 text-base">
            Work out my zakat
          </Link>
        </div>
      </section>
    );
  }

  const Icon = ANSWER_ICONS[round.key];
  const right = picked !== null && picked === round.yes;
  return (
    <section className="card p-5 sm:p-8" aria-labelledby="quiz-question">
      <ol className="flex justify-center gap-1.5" aria-label={`Question ${at + 1} of ${rounds.length}`}>
        {rounds.map((r, i) => (
          <li
            key={r.key}
            className={
              "h-2 w-6 rounded-full " +
              (i < at ? (picks[i] === r.yes ? "bg-pine" : "bg-brass") : i === at ? "bg-ink/60" : "bg-mist")
            }
          />
        ))}
      </ol>
      <div className="mt-6 flex flex-col items-center text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine" aria-hidden>
          {Icon ? <Icon className="h-12 w-12" /> : null}
        </span>
        <p className="mt-4 text-sm text-sage">{round.prompt}…</p>
        <h2 id="quiz-question" className="mt-1 font-serif text-3xl leading-tight text-ink">
          {round.label}
        </h2>
      </div>
      <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3">
        {[true, false].map((value) => {
          const chosen = picked === value;
          const correct = picked !== null && value === round.yes;
          return (
            <button
              key={String(value)}
              type="button"
              disabled={picked !== null}
              aria-pressed={chosen}
              onClick={() => setPicks((p) => [...p.slice(0, at), value])}
              className={
                "min-h-[64px] border-2 text-xl font-medium transition " +
                (picked === null
                  ? "border-pine/40 text-ink hover:border-pine hover:bg-pine/5"
                  : correct
                    ? "border-pine bg-pine text-surface"
                    : chosen
                      ? "border-brass text-brassDeep"
                      : "border-mist text-sage")
              }
            >
              {value ? "Yes" : "No"}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {picked !== null ? (
          <div className="mx-auto mt-6 max-w-md text-center">
            <p className={"flex items-center justify-center gap-2 text-lg font-medium " + (right ? "text-pine" : "text-brassDeep")}>
              {right ? <IconCheckCircle className="h-6 w-6" /> : null}
              {right ? "Right" : "Not quite"}
            </p>
            {/* Most answers open with their verdict; say it only where they do not. */}
            {round.answer.startsWith(round.verdict) ? null : <p className="mt-2 font-medium text-ink">{round.verdict}</p>}
            <p className="mt-1 text-sm leading-relaxed text-sage">{round.answer}</p>
            <button ref={next} type="button" className="btn-primary mt-5 px-6 py-3 text-base" onClick={() => setAt((a) => a + 1)}>
              {at + 1 < rounds.length ? "Next" : "See my score"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
