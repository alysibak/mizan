import Link from "next/link";
import ShopPlanner from "@/components/public/ShopPlanner";
import EvidenceFor from "@/components/public/Evidence";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/shop",
  metaTitle: "Zakat on a shop or small business: what counts, in pictures",
  metaDescription:
    "Zakat for shopkeepers: count the goods you sell at today's price, the cash in the till, and money customers owe; take off what you owe suppliers. The shop, shelves, fridges, and van are not counted. Free, no sign-up.",
  appName: "Mizan shop zakat calculator",
  eyebrow: "For shopkeepers",
  title: "Zakat on your shop",
  lede: "What you sell, and the money it brings in, is counted once a year. The shop and what you use to run it are not.",
  sections: [
    {
      heading: "Count on the same day each year",
      body: (
        <p>
          Pick a day (many choose a day in Ramadan) and count then, every Islamic year. Stock goes up and down
          during the year; only what is there on that day is counted, at what it would sell for that day.
        </p>
      ),
    },
    {
      heading: "Which price for the stock?",
      body: (
        <p>
          Most scholars say the price it would sell for on the day. Some allow the wholesale price, what it would
          cost to buy again, which is lower. If you are unsure, use the selling price: it is the careful choice.
        </p>
      ),
    },
    {
      heading: "More than a shop?",
      body: (
        <p>
          Gold, shares, or property you rent out have their own rules. The{" "}
          <Link href="/guide" className="text-pine hover:underline">
            step-by-step guide
          </Link>{" "}
          asks about everything, one thing at a time.
        </p>
      ),
    },
  ],
  faq: [
    {
      q: "My stock is worth a lot but I have little cash. How do I pay?",
      a: "Zakat is on the stock's value even if it is not sold yet. You can pay over the coming weeks as sales come in; the Hanafi school also allows giving goods from the shop at their value.",
    },
    {
      q: "Do I count money customers owe me?",
      a: "Yes, money you expect to be paid. Debts you may never get back are counted only when (and if) they are paid.",
    },
    {
      q: "What about a business partner?",
      a: "Each partner counts their own share of the business with their own savings.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function ShopPage() {
  return (
    <ToolPage copy={copy}>
      <div className="space-y-8">
        <ShopPlanner />
        <div>
          <h2 className="font-serif text-xl text-ink">Why</h2>
          <EvidenceFor caseKey="business" />
        </div>
      </div>
    </ToolPage>
  );
}
