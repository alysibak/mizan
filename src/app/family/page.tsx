import Link from "next/link";
import FamilyPlanner from "@/components/public/FamilyPlanner";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/family",
  metaTitle: "Zakat for the whole family: each person on their own",
  metaDescription:
    "Is zakat counted for the whole family together? No: each person owes on what is theirs. Add your wife or husband, children, and parents, and see who owes, and how much, against today's nisab. Free, private, no sign-up.",
  appName: "Mizan family zakat calculator",
  eyebrow: "For the household",
  title: "Zakat for your family, one person at a time",
  lede: "Zakat is not counted for a household together. Each person owes on what is theirs. Add everyone, and see who owes and how much.",
  sections: [
    {
      heading: "Why not add it all together?",
      body: (
        <p>
          Because the Quran and the Sunnah speak to each owner about their own wealth. A family that adds everything
          together may pay when no one owes (four people each just under the nisab), or miss the one person who
          does (a mother with her own gold). Each person is weighed against the nisab alone.
        </p>
      ),
    },
    {
      heading: "Whose is it?",
      body: (
        <p>
          A wife’s jewellery, her mahr, and her own savings are hers, even if her husband bought them. Money a
          husband keeps for the house is his. A son who earns his own wage owns it. If you are unsure whether
          something was a gift or a loan, ask the person: it belongs to whoever it was given to.
        </p>
      ),
    },
    {
      heading: "Paying for someone else",
      body: (
        <p>
          A husband, a father, or a grown child may pay someone’s zakat for them from their own money, as long as
          that person knows and agrees, since zakat needs the owner’s intention. For each person’s full picture
          (silver, shares, business stock), use the{" "}
          <Link href="/guide" className="text-pine hover:underline">
            step-by-step guide
          </Link>{" "}
          once for each of them.
        </p>
      ),
    },
  ],
  faq: [
    {
      q: "My wife has gold but no money of her own. Who pays?",
      a: "The zakat is hers, on her gold, if it reaches the nisab (in the Hanafi view, worn jewellery included). She can sell a little of it to pay, or her husband can pay it for her with her agreement. He is not obliged to.",
    },
    {
      q: "Do I pay zakat on my children’s savings?",
      a: "Most scholars say a child’s own wealth is zakatable, and the parent pays it from the child’s money. The Hanafi school says zakat is not due on a child’s wealth until they are grown.",
    },
    {
      q: "Is anything stored?",
      a: "The names and figures stay in this browser only, so you can come back to them. Nothing is sent to Mizan.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function FamilyPage() {
  return (
    <ToolPage copy={copy}>
      <FamilyPlanner />
    </ToolPage>
  );
}
