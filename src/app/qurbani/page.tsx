import Link from "next/link";
import UdhiyahTool from "@/components/UdhiyahTool";
import ToolPage, {
  toolMetadata,
  type ToolPageCopy,
} from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/qurbani",
  metaTitle: "Qurbani (udhiyah) share calculator",
  metaDescription:
    "Split the cost of a qurbani animal: one share for a sheep or goat, up to seven for a cow or camel. Who should give udhiyah, when, and how the meat is shared. Free.",
  appName: "Mizan qurbani share calculator",
  eyebrow: "Eid al-Adha",
  title: "Qurbani share calculator",
  lede: "A sheep or goat is one person’s sacrifice; a cow or camel can be shared by up to seven. Enter the price and your shares to see what you owe.",
  sections: [
    {
      heading: "Who gives it",
      body: (
        <p>
          The Hanafi school holds udhiyah obligatory (wajib) for an adult
          Muslim, not travelling, who owns wealth at the nisab beyond their
          needs during the days of sacrifice. The Maliki, Shafi‘i and Hanbali
          schools hold it a strongly recommended sunnah for those who can afford
          it.
        </p>
      ),
    },
    {
      heading: "The animal",
      body: (
        <p>
          A sheep or goat counts for one person; a cow, ox, or camel for up to
          seven. The animal should be healthy and old enough: commonly a sheep
          of at least six months (as large as a yearling) to a year, a goat of a
          year, cattle of two years, and a camel of five. Each sharer’s
          intention should be an act of worship, whether udhiyah, ‘aqiqah, or
          another sacrifice.
        </p>
      ),
    },
    {
      heading: "When",
      body: (
        <p>
          After the Eid prayer on the 10th of Dhul-Hijjah, through the 12th (the
          Hanafi, Maliki and Hanbali view) or the 13th (the Shafi‘i view). A
          sacrifice before the Eid prayer is ordinary meat, not udhiyah.
        </p>
      ),
    },
    {
      heading: "The meat",
      body: (
        <p>
          It is recommended to share it in thirds: for your household, for
          relatives and friends, and for the poor. The skin and meat may not be
          sold or given to the butcher as payment. Many give their qurbani
          through a charity that slaughters and distributes abroad; the share
          price they quote is what you enter above.
        </p>
      ),
    },
    {
      heading: "It is not zakat",
      body: (
        <p>
          Qurbani is a separate act and does not reduce the zakat you owe on
          your wealth.{" "}
          <Link href="/calculator" className="text-pine hover:underline">
            Calculate your zakat
          </Link>
          .
        </p>
      ),
    },
  ],
  faq: [
    {
      q: "How many people can share one cow?",
      a: "Up to seven, each with an equal share. A sheep or goat cannot be shared; it is one person’s sacrifice, though its reward can include the household.",
    },
    {
      q: "Can I give qurbani on behalf of someone who has died?",
      a: "Many scholars allow it, and it is common to give a share for a deceased parent. If the person left a bequest for it, fulfilling that comes from their estate.",
    },
    {
      q: "Do I need to give one for each member of my family?",
      a: "In the Hanafi school, each adult who owns nisab owes their own. In the other schools, one sacrifice can cover a household. Follow the scholars you trust.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function QurbaniPage() {
  return (
    <ToolPage copy={copy}>
      <UdhiyahTool />
    </ToolPage>
  );
}
