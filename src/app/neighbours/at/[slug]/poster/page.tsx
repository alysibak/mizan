import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderSVG } from "uqr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PrintButton from "@/components/public/PrintButton";
import { neighboursMode, partnerBySlug } from "@/lib/neighbours-store";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Poster", robots: { index: false, follow: false } };

/** One A4 page for the mosque's noticeboard, with a code that opens its needs. */
export default async function PartnerPoster({ params }: { params: Promise<{ slug: string }> }) {
  if (neighboursMode() === "off") notFound();
  const partner = await partnerBySlug((await params).slug);
  if (!partner) notFound();
  const target = new URL(`/neighbours/at/${partner.slug}`, siteUrl());
  const qr = renderSVG(target.toString(), { border: 0, ecc: "M", blackColor: "#000000", whiteColor: "#ffffff" }).replace(
    "<svg",
    '<svg aria-hidden="true" focusable="false"',
  );
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-6 md:px-10 print:max-w-none print:p-0">
        <div className="print:hidden">
          <h1 className="font-serif text-3xl text-ink">A poster for {partner.name}</h1>
          <div className="mt-4">
            <PrintButton label="Print the poster" />
          </div>
        </div>
        <article
          aria-label="Poster"
          className="mx-auto mt-8 flex max-w-[42rem] flex-col border border-mist bg-white p-8 text-black sm:p-12 print:mt-0 print:min-h-[260mm] print:max-w-none print:border-0"
        >
          <p className="font-serif text-xl">Mizan Neighbours · {partner.name}</p>
          <h2 className="mt-6 font-serif text-5xl leading-tight print:text-6xl">Help a family near you</h2>
          <ol className="mt-8 space-y-4 text-xl print:text-2xl">
            <li>1. We meet each family and check the need.</li>
            <li>2. You choose one, and give to the mosque.</li>
            <li>3. We pass it on. You hear that it arrived.</li>
          </ol>
          <p className="mt-6 text-lg">Names are never shown. Zakat goes only where our scholar says it may.</p>
          <div className="mt-auto flex flex-wrap items-center gap-6 pt-10">
            <div
              className="h-40 w-40 shrink-0 print:h-56 print:w-56 [&>svg]:h-full [&>svg]:w-full"
              role="img"
              aria-label={`Scan to see the needs: ${target.toString()}`}
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <div>
              <p className="font-serif text-2xl print:text-3xl">Scan to see the needs</p>
              <p className="mt-2 break-all font-mono text-lg" dir="ltr">
                {target.host}
                {target.pathname}
              </p>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
