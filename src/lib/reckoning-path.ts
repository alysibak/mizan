/** The yearly sitting — one spine for tools that close a hawl. */

export const RECKONING_STEPS = [
  {
    id: "forgotten",
    n: 1,
    title: "Remember",
    href: "/tools/forgotten",
    nextLabel: "Watch nisab",
  },
  {
    id: "what-if",
    n: 2,
    title: "Watch nisab",
    href: "/tools/what-if",
    nextLabel: "Sketch envelopes",
  },
  {
    id: "envelopes",
    n: 3,
    title: "Envelopes",
    href: "/tools/envelopes",
    nextLabel: "Pay & freeze",
  },
  {
    id: "freeze",
    n: 4,
    title: "Pay & freeze",
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
