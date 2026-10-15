"use client";

import { useState } from "react";
import { IconGlobe, IconHome, IconLand, IconUsers } from "@/components/icons";

const NEAR = [
  { title: "Relatives in need", detail: "A brother, sister, aunt, cousin: twice the reward.", Icon: IconUsers },
  { title: "Neighbours and people you know", detail: "Someone whose need you have seen.", Icon: IconHome },
  { title: "People in your own town", detail: "Through your mosque or a local charity.", Icon: IconLand },
  { title: "Where the need is greater", detail: "Famine, war, or disaster elsewhere.", Icon: IconGlobe },
];

const QUESTIONS = [
  "Do you keep zakat apart from other donations?",
  "Does zakat go only to the eight kinds of people the Quran names?",
  "How soon is it given out? (Within weeks, not years.)",
  "Do you take running costs from zakat, and how much?",
  "Are you registered, and are your accounts public?",
  "Can you tell me where my zakat went?",
];

/** Who to give to first, from nearest outwards. */
export function NearFirst() {
  return (
    <ol className="space-y-2">
      {NEAR.map(({ title, detail, Icon }, i) => (
        <li key={title} className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-medium text-surface nums" aria-hidden>
            {i + 1}
          </span>
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine"
            aria-hidden
          >
            <Icon className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-base font-medium text-ink">{title}</span>
            <span className="block text-sm text-sage">{detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Six questions to ask a charity, ticked off one by one. Nothing is kept. */
export function CharityQuestions() {
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const all = ticked.size === QUESTIONS.length;
  return (
    <div>
      <ul className="space-y-2">
        {QUESTIONS.map((q, i) => {
          const on = ticked.has(i);
          return (
            <li key={q}>
              <label
                className={
                  "flex min-h-[52px] cursor-pointer items-center gap-3 border px-3 py-2 transition " +
                  (on ? "border-pine bg-pine/5" : "border-mist hover:border-sage")
                }
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-[rgb(var(--c-pine))]"
                  checked={on}
                  onChange={() =>
                    setTicked((old) => {
                      const next = new Set(old);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    })
                  }
                />
                <span className="text-sm text-ink">{q}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className={"mt-3 text-sm font-medium nums " + (all ? "text-pine" : "text-sage")} aria-live="polite">
        {all
          ? "Good answers to all six: you can give with confidence."
          : `${ticked.size} of ${QUESTIONS.length} answered well. Tick each one the charity answers clearly.`}
      </p>
    </div>
  );
}
