/** Closing the year, step by step: the few things to do on the zakat day. */

export const RECKONING_STEPS = [
  {
    id: "forgotten",
    n: 1,
    title: "Anything you forgot?",
    href: "/tools/forgotten",
    nextLabel: "Give your zakat",
  },
  {
    id: "envelopes",
    n: 2,
    title: "Give your zakat",
    href: "/tools/envelopes",
    nextLabel: "Keep a copy",
  },
  {
    id: "freeze",
    n: 3,
    title: "Keep a copy of the year",
    href: "/year#freeze-year",
    nextLabel: null,
  },
] as const;

export type ReckoningStepId = (typeof RECKONING_STEPS)[number]["id"];

export function reckoningStep(id: ReckoningStepId) {
  const i = RECKONING_STEPS.findIndex((s) => s.id === id);
  const step = RECKONING_STEPS[i]!;
  const prev = i > 0 ? RECKONING_STEPS[i - 1]! : null;
  const next = i < RECKONING_STEPS.length - 1 ? RECKONING_STEPS[i + 1]! : null;
  return { step, prev, next, index: i, total: RECKONING_STEPS.length };
}
