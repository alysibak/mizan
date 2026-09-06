import Link from "next/link";
import { TRUST } from "@/lib/trust";
import {
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
} from "@/lib/nisab";
import { ZAKAT_RATE_LUNAR, ZAKAT_RATE_SOLAR } from "@/lib/zakat";
import { THRESHOLDS } from "@/lib/screening";
import { formatPercent } from "@/lib/money";

export default function TrustPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="font-serif text-xl text-ink">
        Mizan
      </Link>
      <p className="label mt-10 text-brass">Accountability</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">What is verified</h1>
      <p className="mt-4 leading-relaxed text-sage">
        If you use this app for zakat, do not trust it blindly. Below is an
        honest map of what the code locks down, what is a modern estimate, and
        what you must confirm yourself.
      </p>

      <section className="mt-10 border border-pine/30 bg-pine/5 px-5 py-5">
        <p className="font-serif text-lg text-ink">This is not a fatwa</p>
        <p className="mt-2 text-sm leading-relaxed text-sage">
          Mizan is a personal estimation aid. A number on the screen is only as
          sound as the figures you entered and the ruling you follow. For anything
          consequential, ask a qualified person of knowledge.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Locked in the engine</h2>
        <p className="text-sm text-sage">
          Covered by pure functions and unit tests in{" "}
          <code className="text-ink">src/lib/</code>.
        </p>
        <ul className="mt-4 space-y-4 text-sm leading-relaxed text-sage">
          <li>
            <span className="font-medium text-ink">Rate. </span>
            {TRUST.zakatRateLunar.claim}. Encoded as{" "}
            <span className="nums text-ink">{formatPercent(ZAKAT_RATE_LUNAR, 1)}</span>{" "}
            ({ZAKAT_RATE_LUNAR}).
          </li>
          <li>
            <span className="font-medium text-ink">Nisab weights. </span>
            Gold {NISAB_GOLD_GRAMS}g · silver {NISAB_SILVER_GRAMS}g. You choose
            which standard; both are always computed.
          </li>
          <li>
            <span className="font-medium text-ink">Purification. </span>
            Impermissible income given away is never subtracted from zakat due.
          </li>
          <li>
            <span className="font-medium text-ink">Line math. </span>
            Each holding × portion, minus deductible debts, compared to nisab —
            deterministic.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Modern estimates</h2>
        <p className="text-sm leading-relaxed text-sage">
          Useful defaults. Not prophetic rates. Labeled in the app when they
          apply.
        </p>
        <ul className="mt-4 space-y-4 text-sm leading-relaxed text-sage">
          <li>
            <span className="font-medium text-ink">Solar calendar. </span>
            {TRUST.solarRateAdjustment.claim}. About{" "}
            <span className="nums text-ink">
              {formatPercent(ZAKAT_RATE_SOLAR, 3)}
            </span>
            .
          </li>
          <li>
            <span className="font-medium text-ink">Long-term equities. </span>
            {TRUST.equityPortion.claim}. Always editable.
          </li>
          <li>
            <span className="font-medium text-ink">Stock screens. </span>
            Debt / cash / impermissible income under{" "}
            {formatPercent(THRESHOLDS.debtRatio, 0)} /{" "}
            {formatPercent(THRESHOLDS.cashRatio, 0)} /{" "}
            {formatPercent(THRESHOLDS.impermissibleRevenueRatio, 0)} — AAOIFI-style.
            Passing a screen is not a buy recommendation.
          </li>
          <li>
            <span className="font-medium text-ink">Hawl calendar. </span>
            {TRUST.tabularHawl.claim}. For the payment day, follow local
            moon-sighting.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Where scholars differ</h2>
        <ul className="mt-2 space-y-4 text-sm leading-relaxed text-sage">
          <li>
            <span className="font-medium text-ink">Jewellery. </span>
            {TRUST.jewelleryBySchool.claim}. The school profile only changes the
            default portion for new jewellery rows.
          </li>
          <li>
            <span className="font-medium text-ink">Gold vs silver nisab. </span>
            You choose. The app shows both.
          </li>
          <li>
            <span className="font-medium text-ink">Debt, pensions, equities. </span>
            Notes on each category; portions stay editable. School labels do not
            invent classical “stock percentages.”
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-2xl text-ink">How to verify yourself</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-sage">
          <li>
            Run <code className="text-ink">npm test</code> — the engine tests
            rate, nisab, portions, hawl, and screens.
          </li>
          <li>
            Read <code className="text-ink">src/lib/zakat.ts</code>,{" "}
            <code className="text-ink">nisab.ts</code>,{" "}
            <code className="text-ink">screening.ts</code>,{" "}
            <code className="text-ink">madhhab.ts</code>.
          </li>
          <li>
            Print a statement and walk the lines with someone of knowledge
            before you pay.
          </li>
        </ol>
      </section>

      <p className="mt-12 text-xs leading-relaxed text-sage">
        <Link href="/method" className="text-pine hover:underline">
          How the numbers are made
        </Link>
        <span className="mx-2 text-mist">·</span>
        <Link href="/register" className="text-pine hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
