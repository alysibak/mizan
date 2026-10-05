import Link from "next/link";
import FitrTool from "@/components/FitrTool";
import ToolPage, {
  toolMetadata,
  type ToolPageCopy,
} from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/zakat-al-fitr",
  metaTitle: "Zakat al-Fitr calculator for your household",
  metaDescription:
    "Work out Zakat al-Fitr (fitrana, zakat fitrah) for everyone you provide for: who pays, how much, and when it is due before the Eid prayer. Free, no account.",
  appName: "Mizan Zakat al-Fitr calculator",
  eyebrow: "End of Ramadan",
  title: "Zakat al-Fitr calculator",
  lede: "One set amount for yourself and each person you provide for, children included, given before the Eid prayer. Enter the figure your mosque or council announced this year.",
  sections: [
    {
      heading: "Who gives it",
      body: (
        <p>
          Every Muslim who has more than they need for the day and night of Eid
          gives it for themselves and for those they are responsible for: a
          spouse, young children, and other dependants. Most schools include a
          child born before sunset on the last day of Ramadan. The Hanafi school
          ties the duty to owning wealth at the nisab beyond one’s needs.
        </p>
      ),
    },
    {
      heading: "How much",
      body: (
        <>
          <p>
            One <em>sa‘</em> of the local staple food per person: roughly 2.5 to
            3 kg of dates, barley, raisins, wheat, or rice. The Hanafi school
            accepts half a sa‘ of wheat and allows its value in money; most
            other scholars prefer the food itself.
          </p>
          <p>
            Councils and mosques announce a money figure each Ramadan based on
            local prices. That figure changes by country and by year, so Mizan
            does not guess it.
          </p>
        </>
      ),
    },
    {
      heading: "When it is due",
      body: (
        <p>
          Before the Eid al-Fitr prayer. Many give it a day or two earlier so it
          reaches the poor in time; the Shafi‘i school allows it from the start
          of Ramadan, and the Hanafi school earlier still. Given after the
          prayer, it counts as ordinary charity and the duty remains owed. It
          goes to the poor and needy, so they too can celebrate.
        </p>
      ),
    },
    {
      heading: "It is not zakat on wealth",
      body: (
        <p>
          Zakat al-Fitr is due per person, whatever you own above the day’s
          needs. Zakat on wealth is 2.5% of what you hold above nisab for a
          lunar year.{" "}
          <Link href="/calculator" className="text-pine hover:underline">
            Calculate that here
          </Link>
          .
        </p>
      ),
    },
  ],
  faq: [
    {
      q: "Do I pay Zakat al-Fitr for my children?",
      a: "Yes. The head of the household gives it for every dependant, including children who rely on them. Most scholars also include a child born before the end of Ramadan.",
    },
    {
      q: "Can I give money instead of food?",
      a: "The Hanafi school permits giving the value in money, and many councils announce a money figure for that reason. The Maliki, Shafi‘i and Hanbali schools prefer the staple food itself. Follow the scholars you trust.",
    },
    {
      q: "Is Zakat al-Fitr the same as fitrana or zakat fitrah?",
      a: "Yes. Fitrana (South Asia), zakat fitrah (Southeast Asia), and sadaqat al-fitr all name the same obligation at the end of Ramadan.",
    },
    {
      q: "What if I missed the deadline?",
      a: "Give it as soon as you can. Given after the Eid prayer, it counts as charity rather than Zakat al-Fitr, but the obligation is not cancelled by being late.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function ZakatAlFitrPage() {
  return (
    <ToolPage copy={copy}>
      <FitrTool />
    </ToolPage>
  );
}
