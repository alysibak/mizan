import Link from "next/link";

export default function MethodPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="font-serif text-xl text-ink">
        Mizan
      </Link>
      <p className="label mt-10 text-brassDeep">How the numbers are made</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">The method</h1>
      <p className="mt-4 leading-relaxed text-sage">
        Mizan is an estimation aid. The functions below are pure and tested.
        They do not call a bank, a metals vendor, or a scholar. You can read
        them in the repository.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Zakat</h2>
        <p className="text-sm leading-relaxed text-sage">
          Each holding is multiplied by a zakatable portion (cash is 1, long-term
          equities default near 0.25 and are editable). Immediate debts marked
          deductible are subtracted. If the remainder meets nisab, zakat is 2.5%
          on a lunar year, or 2.5% × (365.25 / 354.367) ≈ 2.577% on a solar year.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Nisab</h2>
        <p className="text-sm leading-relaxed text-sage">
          Gold nisab is 85 grams. Silver nisab is 595 grams. You choose which
          standard applies and you set the price per gram. A suggested price can
          be fetched from a free public source; it never overrides a figure you
          have saved.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-ink">School profile</h2>
        <p className="text-sm leading-relaxed text-sage">
          Hanafi, Maliki, Shafi&apos;i, Hanbali, or general. Today the profile
          mainly adjusts jewellery defaults and madhhab notes. Long-term
          equities and pensions still use estimate defaults you can edit — the
          school label does not invent classical stock or pension law. It never
          rewrites rows you already entered. Convenience, not a fatwa.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Hawl</h2>
        <p className="text-sm leading-relaxed text-sage">
          The holding year is one Hijri year from the date wealth crossed nisab,
          counted on the tabular (arithmetic) Islamic calendar or, if you
          choose it in settings, the Umm al-Qura tables. Payable status uses
          one ledger hawl start (your settings date): new money joins the
          year already running rather than starting its own, so per-holding
          dates are reminders only. If wealth fell below nisab mid-year, The
          year page lets you restart the hawl — the schools differ on whether
          that is needed. Either calendar can differ from moon-sighting by a
          day or two; for payment day, follow your local sighting.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Screening</h2>
        <p className="text-sm leading-relaxed text-sage">
          Two gates, AAOIFI-style: no core haram activity, then debt, cash, and
          impermissible-revenue ratios under 30%, 30%, and 5%. The denominator
          may be market cap or total assets. Purification is the impermissible
          revenue ratio of dividends — recorded separately from zakat.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Mirath</h2>
        <p className="text-sm leading-relaxed text-sage">
          Sunni faraid with exact fractions, awl, and radd. Grandfather with
          siblings follows the Hanafi block (grandfather like a father); the
          other three schools share differently, and the tool says so.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-serif text-2xl text-ink">Year freezes</h2>
        <p className="text-sm leading-relaxed text-sage">
          A snapshot stores today’s assets, debts, settings, and zakat figure as
          JSON in your account. It does not change the live ledger. Backups
          include freezes so you can move machines without losing history.
        </p>
      </section>

      <p className="mt-12 text-xs leading-relaxed text-sage">
        Scholars differ on gold versus silver nisab, jewellery, long-term
        equities, pensions, and debt. For a real obligation, ask a qualified
        person of knowledge.{" "}
        <Link href="/trust" className="text-pine hover:underline">
          What is verified
        </Link>
        <span className="mx-2 text-sage">·</span>
        <Link href="/register" className="text-pine hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
