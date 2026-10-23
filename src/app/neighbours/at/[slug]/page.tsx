import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ExampleBanner, NeedCard } from "@/components/neighbours/NeedBits";
import { ensureExample, listedNeeds, neighboursMode, partnerBySlug, partnerTotals } from "@/lib/neighbours-store";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const partner = neighboursMode() === "off" ? null : await partnerBySlug((await params).slug);
  if (!partner) return { title: "Not found" };
  return {
    title: `${partner.name}, ${partner.city}: needs near you`,
    description: `Needs checked in person by ${partner.name}. Give to the mosque, and hear back when it arrives.`,
    robots: neighboursMode() === "on" ? undefined : { index: false, follow: false },
  };
}

/** A partner's own page: who they are, how they check, how to give, what they have done. */
export default async function PartnerPage({ params }: Props) {
  const mode = neighboursMode();
  if (mode === "off") notFound();
  await ensureExample();
  const partner = await partnerBySlug((await params).slug);
  if (!partner) notFound();
  const [list, totals] = await Promise.all([listedNeeds({ partnerId: partner.id }), partnerTotals(partner.id)]);
  const year = new Date().getUTCFullYear();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-5 pb-16 pt-6 md:px-10">
        {mode === "demo" ? <ExampleBanner /> : null}
        <Link href="/neighbours" className="inline-flex min-h-[44px] items-center text-base text-pine hover:underline">
          ← All needs
        </Link>
        <header>
          <h1 className="font-serif text-4xl leading-tight text-ink">{partner.name}</h1>
          <p className="mt-1 text-lg text-sage">{partner.city}</p>
        </header>

        <dl className="grid grid-cols-2 gap-4 border-y border-mist py-4" aria-label={`So far in ${year}`}>
          <div>
            <dt className="text-sm text-sage">Needs met in {year}</dt>
            <dd className="font-serif text-3xl text-ink nums">{totals.met}</dd>
          </div>
          <div>
            <dt className="text-sm text-sage">Passed on in {year}</dt>
            <dd className="font-serif text-3xl text-ink nums">{formatMoney(totals.passedOn, partner.currency, "en-CA", { whole: true })}</dd>
          </div>
        </dl>

        <section aria-labelledby="open-needs" className="space-y-3">
          <h2 id="open-needs" className="font-serif text-2xl text-ink">
            Needs now
          </h2>
          {list.length ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {list.map((v) => (
                <NeedCard key={v.need.id} view={v} />
              ))}
            </ul>
          ) : (
            <p className="text-base text-sage">Nothing is listed right now.</p>
          )}
        </section>

        {partner.about ? (
          <section aria-labelledby="about" className="space-y-2">
            <h2 id="about" className="font-serif text-2xl text-ink">
              How we check each need
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-ink">{partner.about}</p>
          </section>
        ) : null}

        {partner.howToGive ? (
          <section aria-labelledby="how-to-give" className="space-y-2">
            <h2 id="how-to-give" className="font-serif text-2xl text-ink">
              How to give
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-ink">{partner.howToGive}</p>
            <p className="text-base text-sage">Choose a need first: it gives you a code to put on your payment.</p>
          </section>
        ) : null}

        {partner.contact ? (
          <p className="text-base text-ink">
            <span className="text-sage">Questions: </span>
            {partner.contact}
          </p>
        ) : null}

        <p>
          <Link href={`/neighbours/at/${partner.slug}/poster`} className="inline-flex min-h-[44px] items-center text-base text-pine hover:underline">
            A poster for the noticeboard →
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
