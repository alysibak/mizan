import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ZakatCalculator from "@/components/ZakatCalculator";
import JsonLd from "@/components/JsonLd";
import { ZAKAT_FAQ, faqJsonLd } from "@/lib/faq";
import { siteUrl } from "@/lib/site";

const TITLE = "Zakat calculator — free, private, no sign-up";
const DESCRIPTION =
  "Work out your zakat in minutes with live gold and silver prices. Gold or silver nisab, jewellery by school, shares, crypto, and debts. Free, private, and nothing you type is stored on a server.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/calculator" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/calculator" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function CalculatorPage() {
  const url = new URL("/calculator", siteUrl()).toString();
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-10">
        <header className="max-w-2xl">
          <p className="label text-brassDeep">Zakat calculator</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            What do you owe this year?
          </h1>
          <p className="mt-4 text-base leading-relaxed text-sage">
            Enter what you own and owe today. Mizan weighs it against nisab with
            live metal prices and gives you a figure in minutes. Free, no
            account, and nothing you type leaves your browser.
          </p>
        </header>

        <div className="mt-10">
          <ZakatCalculator />
        </div>

        <section className="mt-20 grid gap-10 md:grid-cols-3" aria-labelledby="how">
          <h2 id="how" className="sr-only">
            How the calculation works
          </h2>
          {[
            [
              "1. Add up",
              "Each holding is counted at today’s value. Long-term shares and pensions count only the share you set; worn jewellery follows the school you choose.",
            ],
            [
              "2. Take off",
              "Debts due now are subtracted. What remains is your net zakatable wealth.",
            ],
            [
              "3. Weigh",
              "If it meets nisab, zakat is 2.5% for a lunar year. Below nisab, nothing is due.",
            ],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="font-serif text-xl text-ink">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-sage">{body}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 max-w-3xl" aria-labelledby="faq">
          <h2 id="faq" className="font-serif text-3xl text-ink">
            Questions people ask
          </h2>
          <div className="mt-6 divide-y divide-mist border-y border-mist">
            {ZAKAT_FAQ.map((f) => (
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
          <p className="mt-6 text-sm text-sage">
            The arithmetic is open:{" "}
            <Link href="/method" className="text-pine hover:underline">
              how the numbers are made
            </Link>{" "}
            and{" "}
            <Link href="/trust" className="text-pine hover:underline">
              what is verified
            </Link>
            . For your situation, ask a qualified person of knowledge.
          </p>
        </section>
      </main>
      <SiteFooter />
      <JsonLd data={faqJsonLd(ZAKAT_FAQ)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Mizan zakat calculator",
          url,
          applicationCategory: "FinanceApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description: DESCRIPTION,
        }}
      />
    </div>
  );
}
