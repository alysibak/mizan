import Link from "next/link";

export default function ToolsPage() {
  return (
    <div className="space-y-10">
      <header>
        <p className="label text-brass">Beside the ledger</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Tools</h1>
        <p className="mt-2 max-w-xl text-sm text-sage">
          The yearly sitting lives here. Everything else is a satellite — still
          offline, still estimate-honest.
        </p>
      </header>

      <section className="border border-pine/30 bg-pine/5 px-5 py-6">
        <p className="label text-pine">The spine</p>
        <Link
          href="/tools/reckoning-night"
          className="mt-2 block font-serif text-2xl text-ink hover:underline"
        >
          Reckoning night
        </Link>
        <p className="mt-2 text-sm text-sage">
          Remember → watch nisab → envelopes → pay & freeze. Start here when
          you close the year.
        </p>
        <Link href="/tools/reckoning-night" className="btn-primary mt-4">
          Begin the sitting
        </Link>
      </section>

      <div>
        <p className="label text-brass">Sitting tools</p>
        <ul className="mt-3 divide-y divide-mist border-y border-mist">
          <li>
            <Link href="/tools/forgotten" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">Forgotten wealth</p>
              <p className="mt-1 text-sm text-sage">Step 1 — what ledgers miss</p>
            </Link>
          </li>
          <li>
            <Link href="/tools/what-if" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">What if prices move?</p>
              <p className="mt-1 text-sm text-sage">Step 2 — nisab sensitivity</p>
            </Link>
          </li>
          <li>
            <Link href="/tools/envelopes" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">Zakat envelopes</p>
              <p className="mt-1 text-sm text-sage">Step 3 — split across asnaf</p>
            </Link>
          </li>
          <li>
            <Link href="/year#freeze-year" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">Pay & freeze</p>
              <p className="mt-1 text-sm text-sage">
                Step 4 — Give, then seal on The year
              </p>
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <p className="label text-brass">More angles</p>
        <ul className="mt-3 divide-y divide-mist border-y border-mist">
          <li>
            <Link href="/tools/reverse" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">Reverse zakat</p>
              <p className="mt-1 text-sm text-sage">
                If I give this much, how much wealth does that imply?
              </p>
            </Link>
          </li>
          <li>
            <Link href="/tools/forgive" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">Forgive a debt</p>
              <p className="mt-1 text-sm text-sage">
                Record releasing what someone owed you
              </p>
            </Link>
          </li>
          <li>
            <Link href="/tools/fitr" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">Zakat al-Fitr</p>
              <p className="mt-1 text-sm text-sage">
                Per-person amount for your household before Eid
              </p>
            </Link>
          </li>
          <li>
            <Link href="/tools/udhiyah" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">Udhiyah / qurbani</p>
              <p className="mt-1 text-sm text-sage">Split an animal’s cost into shares</p>
            </Link>
          </li>
          <li>
            <Link href="/tools/asnaf" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">The eight asnaf</p>
              <p className="mt-1 text-sm text-sage">Recipient categories for zakat tags</p>
            </Link>
          </li>
          <li>
            <Link href="/screening" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">Shariah screening</p>
              <p className="mt-1 text-sm text-sage">Manual estimate-level checks</p>
            </Link>
          </li>
          <li>
            <Link href="/mirath" className="block py-5 hover:bg-mist/20">
              <p className="font-serif text-lg text-ink">Mirath</p>
              <p className="mt-1 text-sm text-sage">Sunni faraid shares</p>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
