import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ExampleBanner, NeedCard } from "@/components/neighbours/NeedBits";
import { HowItWorks, NeighboursFolds } from "@/components/neighbours/HowItWorks";
import { ensureExample, listedNeeds, neighboursMode } from "@/lib/neighbours-store";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: "Help a family near you",
    description:
      "Needs near you, each checked in person by a mosque you can visit. Give to the mosque, it passes it on, and you hear back when it arrives.",
    alternates: { canonical: "/neighbours" },
    // The example is for showing partners, not for search.
    robots: neighboursMode() === "on" ? undefined : { index: false, follow: false },
  };
}

/** Every need listed now, newest first; or only those zakat may go to. */
export default async function NeighboursPage({ searchParams }: { searchParams: Promise<{ zakat?: string }> }) {
  const mode = neighboursMode();
  if (mode === "off") notFound();
  await ensureExample();
  const zakatOnly = (await searchParams).zakat === "1";
  const list = await listedNeeds({ zakatOnly });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-5 pb-16 pt-6 md:px-10">
        {mode === "demo" ? <ExampleBanner /> : null}
        <header>
          <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">Help a family near you</h1>
          <p className="mt-3 text-lg leading-relaxed text-sage">
            Each need is checked in person by a mosque you can visit. You give to the mosque, it passes it on, and
            you hear back when it arrives.
          </p>
        </header>

        <HowItWorks />

        <nav aria-label="Show" className="flex flex-wrap gap-2">
          <Link
            href="/neighbours"
            aria-current={zakatOnly ? undefined : "page"}
            className={zakatOnly ? "btn-ghost" : "btn-primary"}
          >
            All needs
          </Link>
          <Link
            href="/neighbours?zakat=1"
            aria-current={zakatOnly ? "page" : undefined}
            className={zakatOnly ? "btn-primary" : "btn-ghost"}
          >
            Zakat can go to these
          </Link>
        </nav>

        {list.length ? (
          <ul className="grid gap-4 sm:grid-cols-2" aria-label="Needs">
            {list.map((v) => (
              <NeedCard key={v.need.id} view={v} />
            ))}
          </ul>
        ) : (
          <p className="border border-dashed border-mist px-5 py-8 text-center text-base text-sage">
            No needs are listed right now. Please look again soon, or give through your mosque.
          </p>
        )}

        <p>
          <Link href="/neighbours/mine" className="inline-flex min-h-[44px] items-center text-base font-medium text-pine hover:underline">
            What I promised →
          </Link>
        </p>

        <NeighboursFolds />
      </main>
      <SiteFooter />
    </div>
  );
}
