import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import { FaqList } from "@/components/public/LandingView";
import { faqJsonLd, type Faq } from "@/lib/faq";
import { PAGE_ICONS } from "@/components/pageIcons";
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
  /**
   * Where a visitor goes once the tool has answered them, shown straight
   * under it, so no page is a dead end. Icons are keys of PAGE_ICONS.
   */
  next?: { href: string; label: string; icon: string }[];
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

        {copy.next?.length ? <NextSteps steps={copy.next} /> : null}

        <div className="mt-16 space-y-10 print:hidden">
          {copy.sections.map((s) => (
            <section key={s.heading} className="space-y-3">
              <h2 className="font-serif text-2xl text-ink">{s.heading}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-sage">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-16 print:hidden" aria-labelledby="faq-title">
          <h2 id="faq-title" className="font-serif text-3xl text-ink">
            Questions
          </h2>
          <FaqList items={copy.faq} />
        </section>

        {after}
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

/** "What next?": the obvious next pages, as big picture buttons. */
export function NextSteps({ steps }: { steps: { href: string; label: string; icon: string }[] }) {
  return (
    <nav className="mt-10 print:hidden" aria-labelledby="next-steps">
      <h2 id="next-steps" className="font-serif text-2xl text-ink">
        What next?
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {steps.map((step) => {
          const Icon = PAGE_ICONS[step.icon];
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className="group flex min-h-[72px] items-center gap-4 border-2 border-pine/30 bg-pine/5 px-4 py-3 transition hover:border-pine"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pine text-surface"
                  aria-hidden
                >
                  {Icon ? <Icon className="h-6 w-6" /> : null}
                </span>
                <span className="flex-1 text-base font-medium text-ink">{step.label}</span>
                <span className="text-xl text-pine transition group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
