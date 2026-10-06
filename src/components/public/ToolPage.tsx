import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import { FaqList } from "@/components/public/LandingView";
import { faqJsonLd, type Faq } from "@/lib/faq";
import { PUBLIC_TOOLS } from "@/lib/public-tools";
import { SITE_NAME, siteUrl } from "@/lib/site";

export interface ToolPageCopy {
  path: string;
  metaTitle: string;
  metaDescription: string;
  /** schema.org WebApplication name. */
  appName: string;
  eyebrow: string;
  title: string;
  lede: string;
  sections: { heading: string; body: React.ReactNode }[];
  faq: Faq[];
  /** A guide is an article: no tool, and Article rather than app data. */
  kind?: "tool" | "guide";
  /** YYYY-MM-DD the content was last checked (guides). */
  updated?: string;
}

export function toolMetadata(copy: ToolPageCopy): Metadata {
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: copy.path },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: copy.path,
    },
    twitter: { title: copy.metaTitle, description: copy.metaDescription },
  };
}

/**
 * A free tool's public page: the tool, then what it rests on, then its FAQ.
 * Guides use the same page with a call to the calculator in place of a tool.
 */
export default function ToolPage({
  copy,
  children,
  after,
}: {
  copy: ToolPageCopy;
  children: React.ReactNode;
  /** Shown after the FAQ, before the other tools (e.g. related guides). */
  after?: React.ReactNode;
}) {
  const url = new URL(copy.path, siteUrl()).toString();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-6 md:px-10">
        <header className="max-w-2xl">
          <p className="label text-brassDeep">{copy.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-sage">
            {copy.lede}
          </p>
        </header>

        <div className="mt-10">{children}</div>

        <div className="mt-16 space-y-10">
          {copy.sections.map((s) => (
            <section key={s.heading} className="space-y-3">
              <h2 className="font-serif text-2xl text-ink">{s.heading}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-sage">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-16" aria-labelledby="faq-title">
          <h2 id="faq-title" className="font-serif text-3xl text-ink">
            Questions
          </h2>
          <FaqList items={copy.faq} />
        </section>

        {after}
        <MoreTools except={copy.path} />
      </main>
      <SiteFooter />
      <JsonLd data={faqJsonLd(copy.faq)} />
      <JsonLd
        data={
          copy.kind === "guide"
            ? {
                "@context": "https://schema.org",
                "@type": "Article",
                headline: copy.title,
                description: copy.metaDescription,
                url,
                inLanguage: "en",
                dateModified: copy.updated,
                publisher: { "@type": "Organization", name: SITE_NAME },
              }
            : {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: copy.appName,
                url,
                inLanguage: "en",
                applicationCategory: "FinanceApplication",
                operatingSystem: "Any",
                offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                description: copy.metaDescription,
              }
        }
      />
    </div>
  );
}

export function MoreTools({ except }: { except?: string }) {
  const tools = PUBLIC_TOOLS.filter((t) => t.path !== except);
  return (
    <nav className="mt-16" aria-labelledby="more-tools">
      <h2 id="more-tools" className="font-serif text-2xl text-ink">
        More free tools
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <li key={t.path}>
            <Link
              href={t.path}
              className="card block h-full px-4 py-3 transition hover:border-sage"
            >
              <span className="font-medium text-ink">{t.name}</span>
              <span className="mt-1 block text-sm text-sage">{t.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
