import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { MoreTools } from "@/components/public/ToolPage";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = {
  title: "Zakat guides: gold, savings, shares, crypto, pensions, property",
  description:
    "Plain answers to the zakat questions people ask most: what counts, how to value it, and where the schools of fiqh differ.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndex() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-6 md:px-10">
        <header className="max-w-2xl">
          <p className="label text-brassDeep">Guides</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            Zakat on what you own
          </h1>
          <p className="mt-4 text-base leading-relaxed text-sage">
            What counts, how to value it on your zakat day, and where the schools differ.
            Each guide ends where the numbers are: the calculator.
          </p>
        </header>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link href={g.path} className="card block h-full px-4 py-3 transition hover:border-sage">
                <span className="font-medium text-ink">{g.title}</span>
                <span className="mt-1 block text-sm text-sage">{g.metaDescription}</span>
              </Link>
            </li>
          ))}
        </ul>
        <MoreTools />
      </main>
      <SiteFooter />
    </div>
  );
}
