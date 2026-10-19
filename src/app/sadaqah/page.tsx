import Link from "next/link";
import { DeedCards, DeedDays, TodaysDeed } from "@/components/public/Sadaqah";
import { EvidenceKey } from "@/components/public/Evidence";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";
import { messagesFor } from "@/i18n/messages";

const copy: ToolPageCopy = {
  path: "/sadaqah",
  metaTitle: "Sadaqah without money: 18 kinds of charity from the hadith",
  metaDescription:
    "You do not need money to give charity. A smile, a kind word, moving harm off the road, water, planting a tree: the sadaqah the Prophet ﷺ named, each with its source, and one to do today.",
  appName: "Mizan everyday sadaqah",
  eyebrow: "Charity that costs nothing",
  title: "Sadaqah you can give today, without money",
  lede: "Charity is not only for people with money. The Prophet ﷺ named these, and many more. Pick one and do it today.",
  sections: [
    {
      heading: "Sadaqah and zakat",
      body: (
        <p>
          Zakat is a set share of wealth, owed once a year by those who have enough. Sadaqah is any good you give
          freely, at any time, and anyone can give it. If you have no money to give, you still have these. To find
          out whether you owe zakat, start{" "}
          <Link href="/start" className="text-pine hover:underline">
            here
          </Link>
          .
        </p>
      ),
    },
  ],
  next: [
    { href: "/start", label: "Do I owe zakat as well?", icon: "start" },
    { href: "/quiz", label: "Zakat in ten questions", icon: "quiz" },
  ],
  faq: [
    {
      q: "Is a smile really charity?",
      a: "Yes. The Prophet ﷺ said, “Your smile in the face of your brother is sadaqah”, reported by al-Tirmidhi and graded hasan. He also said a good word is sadaqah, in Bukhari and Muslim.",
    },
    {
      q: "Does this replace zakat?",
      a: "No. Someone who owes zakat must still pay it from their wealth. These are extra good deeds, open to everyone.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function SadaqahPage() {
  const en = messagesFor("en");
  return (
    <ToolPage copy={copy}>
      <div className="space-y-8">
        <TodaysDeed share={en.common.share} />
        <DeedDays />
        <div>
          <h2 className="font-serif text-2xl text-ink">All of them</h2>
          <p className="mt-1 text-sm text-sage">Tap one to see where it comes from.</p>
          <div className="mt-3">
            <EvidenceKey />
          </div>
          <div className="mt-4">
            <DeedCards />
          </div>
        </div>
      </div>
    </ToolPage>
  );
}
