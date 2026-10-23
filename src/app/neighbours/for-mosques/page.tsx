import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PrintButton from "@/components/public/PrintButton";
import { contactEmail } from "@/lib/legal";
import { CONTACT_KEEP_DAYS, EXPIRY_DAYS, PLEDGE_HOLD_DAYS, REPORTS_TO_PAUSE } from "@/lib/neighbours";
import { neighboursMode } from "@/lib/neighbours-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "For mosques: taking part in Mizan Neighbours",
  description:
    "What a mosque or community group agrees to when it lists needs on Mizan Neighbours: checking each need, privacy, zakat eligibility, money, complaints and time limits.",
};

const AGREE: { title: string; points: string[] }[] = [
  {
    title: "Checking each need",
    points: [
      "Meet the family in person, and see the papers: the rent letter, the bill, the prescription.",
      "Two of your people agree before a need is listed. Mizan asks a second person to list each one, unless you turn this off.",
      "List only what you can pay out yourselves once the money arrives.",
    ],
  },
  {
    title: "Zakat or charity",
    points: [
      "Your own scholar decides whether zakat may go to each need. Mark the ones that are for general charity only.",
      "Keep zakat and other charity apart in your accounts, as you already do.",
    ],
  },
  {
    title: "Privacy and dignity",
    points: [
      "Never write a name, an address, a phone number, a photo, or anything else that could show who the family is.",
      "Say what is needed, not who needs it. In a small community, keep details few.",
      "List nothing without the family’s agreement.",
    ],
  },
  {
    title: "Money",
    points: [
      "Givers pay you directly, the way you choose, with their code as the reference. Mizan never holds money.",
      `Mark each payment received when it arrives. A promise holds its place for ${PLEDGE_HOLD_DAYS} days, then lapses.`,
      "If more arrives than a need takes, tell the giver, and pass it to the next need only with their agreement.",
      "Givers’ names and contacts are for matching payments, and Mizan deletes them " +
        `${CONTACT_KEEP_DAYS} days after a promise is settled.`,
    ],
  },
  {
    title: "Reports and time limits",
    points: [
      `Anyone can report a need. After ${REPORTS_TO_PAUSE} reports it comes off the list until you look at it.`,
      "Answer reports within a week: either nothing is wrong, or remove the need.",
      `A need is listed for ${EXPIRY_DAYS} days unless you choose otherwise. Close it with a short thank-you once it is met.`,
    ],
  },
];

/** What taking part means, and how to start: for the imam and the committee. */
export default function ForMosquesPage() {
  if (neighboursMode() === "off") notFound();
  const email = contactEmail();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-8 px-5 pb-16 pt-6 md:px-10">
        <header>
          <p className="eyebrow">Mizan Neighbours</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink">For mosques and community groups</h1>
          <p className="mt-3 text-lg leading-relaxed text-sage">
            You already know who in your community is struggling. Mizan Neighbours lets people who want to help find
            those needs, give to you, and hear that it arrived, without anyone being named.
          </p>
        </header>

        <section aria-labelledby="start" className="space-y-3">
          <h2 id="start" className="font-serif text-2xl text-ink">
            How to start
          </h2>
          <ol className="list-decimal space-y-2 ps-6 text-base leading-relaxed text-ink">
            <li>
              Each person who will run it makes a free Mizan account.{" "}
              <Link href="/register" className="text-pine underline underline-offset-2">
                Make one
              </Link>
              .
            </li>
            <li>
              {email ? (
                <>
                  Write to{" "}
                  <a href={`mailto:${email}`} className="text-pine underline underline-offset-2">
                    {email}
                  </a>{" "}
                  with your mosque’s name, city, and the email of the person who will lead it.
                </>
              ) : (
                "Contact whoever runs this Mizan site with your mosque’s name, city, and the email of the person who will lead it."
              )}
            </li>
            <li>Once you are added, open your desk, write how you check needs and how to give, and add a second person.</li>
            <li>Write your first needs. A second person checks and lists each one.</li>
            <li>Print your poster for the noticeboard, and tell the congregation after Jumu‘ah.</li>
          </ol>
        </section>

        <section aria-labelledby="agree" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="agree" className="font-serif text-2xl text-ink">
              What you agree to
            </h2>
            <PrintButton label="Print this page" />
          </div>
          {AGREE.map((group) => (
            <div key={group.title}>
              <h3 className="font-serif text-xl text-ink">{group.title}</h3>
              <ul className="mt-2 space-y-2">
                {group.points.map((p) => (
                  <li key={p} className="flex gap-3 text-base leading-relaxed text-ink">
                    <span aria-hidden className="mt-1 text-pine">
                      ✓
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="mizan-does" className="space-y-2">
          <h2 id="mizan-does" className="font-serif text-2xl text-ink">
            What Mizan does, and does not do
          </h2>
          <p className="text-base leading-relaxed text-ink">
            Mizan shows your needs, holds each promise’s place, tells you when someone promises, and tells the giver
            when you mark it received. It does not check needs, hold money, or decide what zakat may go to: you do.
            Every need says who checked it, so your good name is what givers trust.
          </p>
        </section>

        <p>
          <Link href="/neighbours" className="inline-flex min-h-[44px] items-center text-base font-medium text-pine hover:underline">
            See how needs look →
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
