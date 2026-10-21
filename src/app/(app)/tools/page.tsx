import Link from "next/link";

const TOOLS = [
  { href: "/tools/fitr", title: "Zakat al-Fitr", line: "How much to give for each person before the Eid prayer" },
  { href: "/tools/udhiyah", title: "Qurbani", line: "Share the cost of an animal for Eid al-Adha" },
  { href: "/tools/forgive", title: "Forgive a debt", line: "Let go of money someone owes you, so it is no longer counted" },
  { href: "/tools/asnaf", title: "Who can receive zakat", line: "The eight groups named in the Quran" },
  { href: "/tools/what-if", title: "If gold or silver prices change", line: "Would you still be above the minimum (nisab)?" },
  { href: "/tools/reverse", title: "Work back from what you gave", line: "If I gave this much zakat, how much did I own?" },
  { href: "/screening", title: "Is a share halal?", line: "A rough check of a company’s shares" },
  { href: "/mirath", title: "Inheritance shares", line: "Who gets what, by the Sunni rules" },
];

export default function ToolsPage() {
  return (
    <div className="space-y-10">
      <header>
        <p className="label text-brassDeep">Tools</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Tools</h1>
        <p className="mt-2 max-w-xl text-base text-sage">
          Help for the day your zakat is due, and for other things you may
          need once in a while.
        </p>
      </header>

      <section className="border border-pine/30 bg-pine/5 px-5 py-6">
        <p className="label text-pine">When your zakat day comes</p>
        <Link
          href="/tools/reckoning-night"
          className="mt-2 block font-serif text-2xl text-ink hover:underline"
        >
          Close the year, step by step
        </Link>
        <p className="mt-2 text-sm text-sage">
          Check for anything you forgot, give your zakat, then keep a copy of
          the year.
        </p>
        <Link href="/tools/reckoning-night" className="btn-primary mt-4">
          Start
        </Link>
      </section>

      <div>
        <p className="label text-brassDeep">Other tools</p>
        <ul className="mt-3 divide-y divide-mist border-y border-mist">
          {TOOLS.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="block py-5 hover:bg-mist/20">
                <p className="font-serif text-lg text-ink">{t.title}</p>
                <p className="mt-1 text-sm text-sage">{t.line}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
