import Link from "next/link";
import { CharityQuestions, NearFirst } from "@/components/public/GiveGuide";
import EvidenceFor from "@/components/public/Evidence";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/give",
  metaTitle: "Where to give your zakat: who first, and how to choose a charity",
  metaDescription:
    "Relatives in need first, then neighbours, your town, and where need is greater. Six questions to ask a charity before you give it your zakat, and why to give quietly and soon. With the evidence.",
  appName: "Mizan where-to-give guide",
  eyebrow: "Giving well",
  title: "Where to give your zakat",
  lede: "You have worked out what you owe. Now: who should it go to first, how to choose a charity, and how to give it.",
  sections: [
    {
      heading: "Only to the eight",
      body: (
        <p>
          Zakat may go only to the eight kinds of people the Quran names: the poor, the needy, those who collect
          it, those whose hearts are being won, freeing captives, people in debt, in the way of Allah, and the
          stranded traveller. Check a person you are unsure about on{" "}
          <Link href="/who-can-receive" className="text-pine hover:underline">
            Can I give zakat to…?
          </Link>
        </p>
      ),
    },
  ],
  next: [
    { href: "/who-can-receive", label: "Check a person before giving", icon: "who" },
    { href: "/sadaqah", label: "Charity without money", icon: "sadaqah" },
  ],
  faq: [
    {
      q: "Do I have to tell the person it is zakat?",
      a: "No. As long as they are someone who may receive it, you can simply give it. Many scholars prefer not to say, to spare their dignity.",
    },
    {
      q: "Can I give all my zakat to one person?",
      a: "The Hanafi, Maliki, and Hanbali schools allow it, as long as they may receive it, and many prefer giving enough to truly lift one family over a little to many. The Shafi‘i school asks that it be shared among the groups that can be found.",
    },
    {
      q: "Can I pay it early?",
      a: "Yes, most scholars allow paying before your zakat day, for example to help someone in need now. Paying late, once it is due, is not allowed without a reason.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function GivePage() {
  return (
    <ToolPage copy={copy}>
      <div className="space-y-10">
        <section aria-labelledby="near">
          <h2 id="near" className="font-serif text-2xl text-ink">
            Who first: start close, then go outwards
          </h2>
          <p className="mt-1 text-sm text-sage">
            Not your parents, children, or wife: you already provide for them, so it must go to others.
          </p>
          <div className="mt-4">
            <NearFirst />
          </div>
          <EvidenceFor caseKey="giveNear" />
        </section>

        <section aria-labelledby="ask-charity">
          <h2 id="ask-charity" className="font-serif text-2xl text-ink">
            Six questions to ask a charity
          </h2>
          <p className="mt-1 text-sm text-sage">
            A good charity is glad to answer. Tick each one it answers clearly.
          </p>
          <div className="mt-4">
            <CharityQuestions />
          </div>
        </section>

        <section aria-labelledby="quietly">
          <h2 id="quietly" className="font-serif text-2xl text-ink">
            Give it quietly
          </h2>
          <p className="mt-1 text-base leading-relaxed text-sage">
            Hiding your charity is better than showing it, and reminding someone of what you gave cancels its
            reward. Give in a way that keeps their dignity.
          </p>
          <EvidenceFor caseKey="giveQuietly" />
        </section>

        <section aria-labelledby="soon">
          <h2 id="soon" className="font-serif text-2xl text-ink">
            Give it soon
          </h2>
          <p className="mt-1 text-base leading-relaxed text-sage">
            Once zakat is due, do not hold on to it: the people it belongs to are waiting. You may give it early,
            but not late.
          </p>
          <EvidenceFor caseKey="giveSoon" />
        </section>
      </div>
    </ToolPage>
  );
}
