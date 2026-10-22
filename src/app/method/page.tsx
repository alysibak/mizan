import type { Metadata } from "next";
import Link from "next/link";
import AboutFrame from "@/components/AboutFrame";
import { NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from "@/lib/nisab";
import { ZAKAT_RATE_LUNAR, ZAKAT_RATE_SOLAR } from "@/lib/zakat";
import { formatPercent } from "@/lib/money";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Mizan works out zakat, what its code checks, what is a modern estimate, and what you should check yourself.",
  alternates: { canonical: "/method" },
};

/** How the sums are done and what they rest on, in one place. */
export default function MethodPage() {
  return (
    <AboutFrame>
      <p className="label mt-4 text-brassDeep">How it works</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">How Mizan works it out</h1>

      <section className="mt-8 border border-pine/30 bg-pine/5 px-5 py-5">
        <p className="font-serif text-lg text-ink">This is not a fatwa</p>
        <p className="mt-2 text-sm leading-relaxed text-sage">
          Mizan helps you add up. The answer is only as good as the figures you
          type and the rulings you follow. For anything you are unsure of, ask
          someone of knowledge you trust.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-2xl text-ink">The sum</h2>
        <ol className="list-decimal space-y-2 ps-5 text-base leading-relaxed text-sage">
          <li>Add up what counts: cash, bank, gold and silver kept as savings, goods for sale, money you expect back.</li>
          <li>Take off debts you must pay soon.</li>
          <li>
            If what is left is at least the minimum (nisab), zakat is{" "}
            <span className="nums text-ink">{formatPercent(ZAKAT_RATE_LUNAR, 1)}</span> of it.
          </li>
        </ol>
        <p className="text-sm leading-relaxed text-sage">
          The minimum is the value of {NISAB_SILVER_GRAMS} g of silver or {NISAB_GOLD_GRAMS} g of gold at today’s
          price. Silver gives the lower minimum, which many scholars advise as it is better for the poor; you can choose
          gold. Today’s prices come from free public sources, and you can always type your own.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Your zakat day</h2>
        <p className="text-sm leading-relaxed text-sage">
          Zakat is due once a full lunar (Hijri) year has passed since you first had the minimum, and on that day every
          year after. Money that arrives during the year joins the year already running. Mizan counts the year on the
          standard Hijri calendar, or the Umm al-Qura calendar if you choose it; either may be a day off from the moon
          where you live. If you dropped below the minimum during the year, the madhhabs differ on whether the year starts
          again, and the account lets you choose.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-2xl text-ink">What is fixed, and what is an estimate</h2>
        <ul className="space-y-3 text-sm leading-relaxed text-sage">
          <li>
            <span className="font-medium text-ink">Fixed and tested: </span>
            the 2.5% rate, the nisab weights, the sum above, and that interest given away is never taken off zakat.
          </li>
          <li>
            <span className="font-medium text-ink">Modern estimates you can change: </span>
            counting the year by the solar calendar (about{" "}
            <span className="nums text-ink">{formatPercent(ZAKAT_RATE_SOLAR, 3)}</span>, to make up for the longer
            year), and counting about 25% of shares kept for the long run.
          </li>
          <li>
            <span className="font-medium text-ink">Where scholars differ: </span>
            jewellery you wear (your madhhab decides), gold or silver for the minimum, long loans, and pensions. Mizan
            says so where it comes up, and leaves the choice to you.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Check it yourself</h2>
        <ol className="list-decimal space-y-2 ps-5 text-sm leading-relaxed text-sage">
          <li>Every answer shows how it was worked out: tap “How it was worked out”.</li>
          <li>
            Every ruling links to its source in the Quran and Sunnah, on{" "}
            <Link href="/sources" className="text-pine hover:underline">
              Where the rules come from
            </Link>
            .
          </li>
          <li>Print your figures and go through them with someone of knowledge before you give.</li>
          <li>
            The code is open: the sums live in <code className="text-ink">src/lib/zakat.ts</code> and{" "}
            <code className="text-ink">src/lib/nisab.ts</code>, with tests.
          </li>
        </ol>
      </section>

      <p className="mt-12 text-xs leading-relaxed text-sage">
        <Link href="/privacy" className="text-pine hover:underline">
          Privacy
        </Link>
        <span className="mx-2 text-sage">·</span>
        <Link href="/terms" className="text-pine hover:underline">
          Terms
        </Link>
      </p>
    </AboutFrame>
  );
}
