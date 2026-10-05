import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import { ZAKAT_FAQ } from "@/lib/faq";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

// Static: signed-in visitors are sent to their balance by the proxy, so this
// page never touches the database, however many people an ad brings.
export const metadata: Metadata = {
  title: { absolute: "Mizan: free zakat calculator and ledger" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const FEATURES: { title: string; body: string }[] = [
  {
    title: "Live nisab",
    body: "Today’s gold and silver prices in your currency, with both standards side by side. You choose which applies.",
  },
  {
    title: "Your hawl, on the Hijri calendar",
    body: "Count the lunar year from the day your wealth crossed nisab, on the tabular or Umm al-Qura calendar, with a reminder in your own calendar app.",
  },
  {
    title: "A ledger that knows zakat",
    body: "Cash, gold and silver by weight and karat, shares, crypto, business stock, money owed to you, and holdings in other currencies.",
  },
  {
    title: "Every gift in one place",
    body: "Zakat, sadaqah, Zakat al-Fitr, and purification, with the eight asnaf. See what is paid and what is still owed this cycle.",
  },
  {
    title: "Close the year with care",
    body: "Freeze the year’s figures, print a statement, start the next hawl, and leave a letter for next year’s self.",
  },
  {
    title: "On your phone",
    body: "Install it from the browser like an app. Light and dark, readable by everyone, and no app store needed.",
  },
];

export default function LandingPage() {
  const url = siteUrl().toString();
  return (
    <div className="relative min-h-screen overflow-hidden bg-porcelain bg-pine-wash">
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-80" aria-hidden />
      <SiteHeader />

      <main>
        <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:px-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:pt-16">
          <div>
            <p className="animate-fade-up font-serif text-sm tracking-[0.2em] text-brassDeep">
              الميزان · the balance
            </p>
            <h1 className="animate-fade-up mt-4 font-serif text-5xl leading-[1.02] tracking-tight text-ink sm:text-6xl md:text-7xl">
              Zakat, worked out with care.
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-sage"
              style={{ animationDelay: "80ms" }}
            >
              A free, private zakat calculator and ledger. Weigh what you hold
              against nisab with live metal prices, keep your hawl on the Hijri
              calendar, and close each year with a figure you can trust.
            </p>
            <div
              className="animate-fade-up mt-10 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "140ms" }}
            >
              <Link href="/calculator" className="btn-primary px-6 py-3 text-base">
                Calculate your zakat
              </Link>
              <Link href="/register" className="btn-ghost px-6 py-3 text-base">
                Open a free ledger
              </Link>
            </div>
            <p
              className="animate-fade-up mt-6 text-sm text-sage"
              style={{ animationDelay: "200ms" }}
            >
              Free · No ads · No bank linking · Export or delete your data at any time
            </p>
          </div>

          <SampleResult />
        </section>

        <section
          className="relative z-10 border-t border-mist bg-paper/60 px-5 py-20 md:px-10"
          aria-labelledby="features"
        >
          <div className="mx-auto max-w-6xl">
            <p className="label text-brassDeep">The whole zakat year</p>
            <h2 id="features" className="mt-2 max-w-2xl font-serif text-3xl text-ink sm:text-4xl">
              More than a one-off sum
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-sage">
              Most calculators forget you the moment you close the tab. Mizan
              keeps the year: when your hawl began, what you hold, what you have
              given, and what is still due.
            </p>
            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="border-t border-mist pt-5">
                  <h3 className="font-serif text-xl text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sage">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-20 md:px-10" aria-labelledby="honest">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
            <div>
              <p className="label text-brassDeep">Honest about differences</p>
              <h2 id="honest" className="mt-2 font-serif text-3xl text-ink">
                Your school, your choices
              </h2>
              <p className="mt-4 leading-relaxed text-sage">
                Where scholars differ (the gold or silver nisab, jewellery you
                wear, long-term shares, pensions, debts), Mizan shows the
                difference and lets you choose, instead of deciding for you. It
                is an estimation aid, not a fatwa, and says so.
              </p>
              <p className="mt-4 text-sm">
                <Link href="/method" className="text-pine hover:underline">
                  How the numbers are made
                </Link>
                <span className="mx-2 text-sage">·</span>
                <Link href="/trust" className="text-pine hover:underline">
                  What is verified
                </Link>
              </p>
            </div>
            <div>
              <p className="label text-brassDeep">Private by design</p>
              <h2 className="mt-2 font-serif text-3xl text-ink">Your wealth stays yours</h2>
              <ul className="mt-4 space-y-2 leading-relaxed text-sage">
                <li>No advertising, no selling data, no bank logins.</li>
                <li>The calculator runs in your browser and saves nothing on a server.</li>
                <li>Passwords are hashed; one cookie keeps you signed in.</li>
                <li>Download everything, or delete your account, whenever you like.</li>
              </ul>
              <p className="mt-4 text-sm">
                <Link href="/privacy" className="text-pine hover:underline">
                  Privacy policy
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section
          className="relative z-10 border-t border-mist bg-paper/60 px-5 py-20 md:px-10"
          aria-labelledby="questions"
        >
          <div className="mx-auto max-w-3xl">
            <h2 id="questions" className="font-serif text-3xl text-ink">
              Common questions
            </h2>
            <div className="mt-6 divide-y divide-mist border-y border-mist">
              {ZAKAT_FAQ.slice(0, 5).map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                    {f.q}
                    <span className="text-sage transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-sage">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-4 text-sm">
              <Link href="/calculator#faq" className="text-pine hover:underline">
                More questions
              </Link>
            </p>
          </div>
        </section>

        <section className="relative z-10 px-5 py-24 text-center md:px-10">
          <h2 className="mx-auto max-w-2xl font-serif text-4xl text-ink">
            Know what you owe before Ramadan ends.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/calculator" className="btn-primary px-6 py-3 text-base">
              Calculate your zakat
            </Link>
            <Link href="/register" className="btn-ghost px-6 py-3 text-base">
              Open a free ledger
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url,
          description: SITE_DESCRIPTION,
        }}
      />
    </div>
  );
}

/** An illustrative result, so the page shows what the calculator gives you. */
function SampleResult() {
  const rows: [string, string][] = [
    ["Cash and bank", "$18,400.00"],
    ["Gold, 40 g at 22k", "$4,890.00"],
    ["Long-term funds, 25% of $12,000", "$3,000.00"],
    ["Debts due now", "−$1,800.00"],
  ];
  return (
    <figure
      className="animate-fade-up card relative z-10 p-6"
      style={{ animationDelay: "220ms" }}
      aria-label="An example zakat result"
    >
      <div className="relative mx-auto h-24 max-w-xs" aria-hidden>
        <div
          className="absolute left-1/2 top-5 h-px w-56 bg-ink/70"
          style={{ transform: "translateX(-50%) rotate(-6deg)" }}
        >
          <span className="absolute -left-1.5 -top-1 h-3 w-3 rotate-45 border border-brass bg-paper" />
          <span className="absolute -right-1.5 -top-1 h-3 w-3 rotate-45 border border-brass bg-paper" />
        </div>
        <div className="absolute left-1/2 top-5 h-12 w-px -translate-x-1/2 bg-mist" />
        <div className="absolute bottom-1 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[9px] border-b-[16px] border-x-transparent border-b-ink/80" />
      </div>
      <p className="label mt-2 text-pine">Zakat due</p>
      <p className="mt-1 font-serif text-4xl text-pine nums">$612.25</p>
      <p className="mt-1 text-xs text-sage">2.5% of $24,490.00, above the silver nisab</p>
      <dl className="mt-5 space-y-1.5 border-t border-mist pt-4 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-sage">{label}</dt>
            <dd className={"nums " + (value.startsWith("−") ? "text-danger" : "text-ink")}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <figcaption className="mt-4 text-xs text-sage">Example figures.</figcaption>
    </figure>
  );
}
