import Link from "next/link";
import { IconCheckCircle, IconDome, IconOpenHand } from "@/components/icons";
import { PLEDGE_HOLD_DAYS, REPORTS_TO_PAUSE } from "@/lib/neighbours";

const STEPS = [
  { Icon: IconDome, text: "A mosque meets the family and checks the need." },
  { Icon: IconOpenHand, text: "You promise an amount and pay the mosque." },
  { Icon: IconCheckCircle, text: "The mosque passes it on. You hear it arrived." },
];

/** Three pictures: the whole idea before any words about it. */
export function HowItWorks() {
  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="How it works">
      {STEPS.map(({ Icon, text }, i) => (
        <li key={text} className="flex items-center gap-3 border border-mist bg-paper/60 p-3 sm:flex-col sm:text-center">
          <span
            aria-hidden
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pine text-surface"
          >
            <Icon className="h-6 w-6" />
            <span className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brass text-xs font-semibold text-surface">
              {i + 1}
            </span>
          </span>
          <span className="text-base leading-snug text-ink">{text}</span>
        </li>
      ))}
    </ol>
  );
}

/** The questions people ask, folded: checking, money, privacy, and help for themselves. */
export function NeighboursFolds() {
  const folds: { q: string; a: React.ReactNode }[] = [
    {
      q: "How is each need checked?",
      a: (
        <>
          <p>
            The mosque or community group meets the family in person and sees the papers: the rent letter, the bill,
            the prescription. Usually two of its people agree before a need is listed. Mizan does not check needs
            itself, so each need says who checked it.
          </p>
          <p>
            Whether zakat can go to a need is decided by the mosque’s own scholar. Needs that are for general
            charity only say so.
          </p>
        </>
      ),
    },
    {
      q: "Where does my money go?",
      a: (
        <p>
          To the mosque, never to Mizan. You pay it the way it asks, with your code as the reference, and it passes
          the money on. A promise holds its place for {PLEDGE_HOLD_DAYS} days; if nothing arrives by then, the place
          goes to someone else. No more can be promised than is needed.
        </p>
      ),
    },
    {
      q: "Who can see the family?",
      a: (
        <p>
          No one here. Names, addresses, phone numbers and photos are never shown; a need says what is needed, not who
          needs it. If you think one could show who the family is, tap “Something wrong with this?” on it. After{" "}
          {REPORTS_TO_PAUSE} reports a need comes off the list until the mosque looks at it.
        </p>
      ),
    },
    {
      q: "I need help myself",
      a: (
        <p>
          Speak to one of the mosques here in person. They will listen, keep your name private, and decide with you
          what to ask for. Nothing is listed without your agreement.
        </p>
      ),
    },
    {
      q: "Our mosque would like to take part",
      a: (
        <p>
          <Link href="/neighbours/for-mosques" className="text-pine underline underline-offset-2">
            Read what taking part means
          </Link>
          : how needs are checked, what you agree to, and how to start.
        </p>
      ),
    },
  ];
  return (
    <section aria-labelledby="questions" className="border-t border-mist pt-6">
      <h2 id="questions" className="font-serif text-2xl text-ink">
        Questions
      </h2>
      <div className="mt-3 divide-y divide-mist border-y border-mist">
        {folds.map((f) => (
          <details key={f.q}>
            <summary className="text-base font-medium text-ink">{f.q}</summary>
            <div className="space-y-2 pb-4 text-base leading-relaxed text-sage">{f.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
