"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconBank,
  IconCash,
  IconCheckCircle,
  IconGoldBar,
  IconQuestion,
  IconShop,
  IconUsers,
  IconWheat,
  IconYear,
} from "@/components/icons";
import { buildPlan, type Situation } from "@/lib/plan";

const CHOICES: { key: Situation; label: string; Icon: typeof IconCash }[] = [
  { key: "money", label: "Cash or savings", Icon: IconCash },
  { key: "gold", label: "Gold or silver", Icon: IconGoldBar },
  { key: "shop", label: "A shop or business", Icon: IconShop },
  { key: "farm", label: "Crops or farm animals", Icon: IconWheat },
  { key: "family", label: "My family’s money too", Icon: IconUsers },
  { key: "interest", label: "Interest from a bank", Icon: IconBank },
  { key: "missed", label: "Years I did not pay", Icon: IconYear },
  { key: "unsure", label: "Not sure I have to pay", Icon: IconQuestion },
];

/**
 * "What do you have?": tap what is true, get your own plan, in order, each
 * step a tap away. For a visitor who does not know which page they need.
 */
export default function PlanPicker() {
  const [have, setHave] = useState<Set<Situation>>(new Set());
  const steps = buildPlan(have);
  const hasPlan = steps.length > 0;
  // On a phone the plan grows below eight tiles, out of sight: a bar at the
  // bottom says it is there until it scrolls into view.
  const plan = useRef<HTMLDivElement>(null);
  const [planInView, setPlanInView] = useState(false);
  useEffect(() => {
    const el = plan.current;
    if (!hasPlan || !el) return;
    const watch = new IntersectionObserver(([e]) => setPlanInView(e.isIntersecting), { threshold: 0.15 });
    watch.observe(el);
    return () => watch.disconnect();
  }, [hasPlan]);

  function toggle(key: Situation) {
    setHave((old) => {
      const next = new Set(old);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="plan-title">
      <h2 id="plan-title" className="font-serif text-2xl text-ink sm:text-3xl">
        What do you have?
      </h2>
      <p className="mt-1 text-base text-sage">Tap everything that is true for you, and get your own plan.</p>
      <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CHOICES.map(({ key, label, Icon }) => {
          const on = have.has(key);
          return (
            <li key={key}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(key)}
                className={
                  "relative flex h-full min-h-[92px] w-full flex-col items-center justify-center gap-2 border-2 px-2 py-3 text-center transition " +
                  (on ? "border-pine bg-pine/10" : "border-mist bg-surface hover:border-sage")
                }
              >
                <Icon className={"h-8 w-8 " + (on ? "text-pine" : "text-sage")} />
                <span className="text-sm font-medium leading-snug text-ink">{label}</span>
                {on ? (
                  <span className="absolute end-1.5 top-1.5 text-pine" aria-hidden>
                    <IconCheckCircle className="h-5 w-5" />
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite">
        {hasPlan ? (
          <div ref={plan} className="mt-6 scroll-mt-20 border-t border-mist pt-5">
            <h3 className="font-serif text-xl text-ink">Your plan</h3>
            <ol className="mt-3 space-y-2">
              {steps.map((step, i) => (
                <li key={step.key}>
                  <Link
                    href={step.href}
                    className="group flex items-center gap-3 border border-pine/30 bg-pine/5 px-3 py-3 transition hover:border-pine"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine text-base font-medium text-surface nums"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-medium text-ink">{step.title}</span>
                      <span className="block text-sm text-sage">{step.why}</span>
                    </span>
                    <span className="text-xl text-pine transition group-hover:translate-x-1" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
      {hasPlan && !planInView ? (
        <button
          type="button"
          onClick={() => plan.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 bg-pine px-5 py-3 text-base font-medium text-surface shadow-lg sm:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <span>
            Your plan is ready: {steps.length} {steps.length === 1 ? "step" : "steps"}
          </span>
          <span aria-hidden>↓</span>
        </button>
      ) : null}
    </section>
  );
}
