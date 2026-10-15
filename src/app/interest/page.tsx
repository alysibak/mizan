import Link from "next/link";
import InterestHelper from "@/components/public/InterestHelper";
import EvidenceFor from "@/components/public/Evidence";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/interest",
  metaTitle: "My bank paid me interest: what do I do with it?",
  metaDescription:
    "Interest (riba) your bank paid you is not yours to keep: give it away, not as zakat, and leave it out when you count your zakat. Type the amounts and see what to do, with the evidence.",
  appName: "Mizan bank interest helper",
  eyebrow: "Bank interest",
  title: "My bank paid me interest. What now?",
  lede: "Many people find interest on their bank statement without having asked for it. It is not yours to keep, but it is easy to put right.",
  sections: [
    {
      heading: "Stop it coming",
      body: (
        <p>
          Ask your bank to move your money to a current account that pays no interest, or to an Islamic account. In
          many countries a savings account pays interest whether you want it or not; moving it is the lasting fix.
        </p>
      ),
    },
    {
      heading: "What about the bank’s own charges?",
      body: (
        <p>
          Interest you <em>pay</em> on a loan or a card is a separate and more serious matter: it is riba too. Clear
          interest-bearing debt as soon as you can, and talk to a scholar you trust about your situation. Debts due
          now are taken off your wealth in the{" "}
          <Link href="/guide" className="text-pine hover:underline">
            step-by-step guide
          </Link>
          .
        </p>
      ),
    },
  ],
  faq: [
    {
      q: "Can I leave the interest in the bank instead?",
      a: "Most scholars say no: take it out and give it away, so it does not stay with the bank or grow its business.",
    },
    {
      q: "Can I give it to my poor relative?",
      a: "Yes, many scholars allow giving it to anyone poor, relatives included, since you are not giving it as your own charity.",
    },
    {
      q: "I did not know, and kept interest for years.",
      a: "Scholars differ. Some, like Ibn Taymiyyah, apply the verse “whoever receives a warning from his Lord and stops may keep what is past” (2:275) to someone who did not know. Others say to give away what you can still work out. Either way, stop it now, and do not despair of Allah’s mercy.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function InterestPage() {
  return (
    <ToolPage copy={copy}>
      <div className="space-y-8">
        <InterestHelper />
        <div>
          <h2 className="font-serif text-xl text-ink">Why</h2>
          <EvidenceFor caseKey="interest" />
        </div>
      </div>
    </ToolPage>
  );
}
