import Link from "next/link";
import FarmPlanner from "@/components/public/FarmPlanner";
import EvidenceFor from "@/components/public/Evidence";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";

const copy: ToolPageCopy = {
  path: "/farm",
  metaTitle: "Zakat on crops and animals: a tenth, half a tenth, and the herd tables",
  metaDescription:
    "Zakat for farmers: how much of your harvest to give (a tenth, or half a tenth if you paid for the water), and what your goats, sheep, cows, buffalo, or camels owe after a year. Free, with the evidence.",
  appName: "Mizan farm zakat calculator",
  eyebrow: "For farmers",
  title: "Zakat on crops and animals",
  lede: "A farm gives zakat in its own way: part of the harvest when it comes in, and an animal from a herd once a year. Type what you have and see what to give.",
  sections: [
    {
      heading: "The harvest: a tenth, or half a tenth",
      body: (
        <p>
          When land is watered by rain, a river, or a spring, a tenth of the harvest is given. When you water it
          with a pump, a well, or water you buy, it is half a tenth, because the water cost you. It is given when
          the crop is harvested and cleaned; no year has to pass. Most scholars ask it only on a harvest of at
          least five awsuq, about 653 kg of grain.
        </p>
      ),
    },
    {
      heading: "Animals: once a year, from the herd itself",
      body: (
        <p>
          Sheep and goats from forty, cows and buffalo from thirty, and camels from five, once you have owned them
          for a full Islamic year and they graze on open land for most of it. What is given is an animal of a set
          age, healthy, neither the best of the herd nor the worst.
        </p>
      ),
    },
    {
      heading: "What this page does not cover",
      body: (
        <p>
          Animals or crops you keep to sell are trade goods: count what they would sell for in the{" "}
          <Link href="/calculator" className="text-pine hover:underline">
            calculator
          </Link>
          , with your cash. Herds owned in a partnership, and land you rent out or rent in, have their own rules;
          ask a scholar you trust.
        </p>
      ),
    },
  ],
  next: [
    { href: "/guide", label: "Work out zakat on your cash and gold", icon: "guide" },
    { href: "/give", label: "Where to give it", icon: "give" },
  ],
  faq: [
    {
      q: "Can I give money instead of the crop or the animal?",
      a: "The Hanafi school allows giving the value. The Maliki, Shafi‘i, and Hanbali schools ask for the crop or the animal itself, though many allow the value where it serves the poor better.",
    },
    {
      q: "Can I take off what I spent on seed, fertiliser, or labour?",
      a: "Most scholars say no: the lower rate for irrigated land already allows for the cost of water. Some, following Ibn ‘Abbas and Ibn ‘Umar, allow taking off debts taken for the crop. Mizan does not take anything off.",
    },
    {
      q: "Do I count the young born during the year?",
      a: "Yes. Lambs, kids, and calves born to your herd during the year are counted with their mothers, as ‘Umar instructed his collectors.",
    },
    {
      q: "What about fruit and vegetables?",
      a: "Most scholars ask zakat only on crops that are dried and stored, like grain, dates, and raisins. The Hanafi school asks it on everything the land is farmed for. Money you earn from selling fruit and vegetables joins your savings, and is counted in the calculator.",
    },
    {
      q: "How much is five awsuq?",
      a: "Five awsuq is three hundred sa‘, a measure by volume. By weight it is about 653 kg of wheat by a common modern estimate; others reckon from about 600 to 700 kg, and it varies by crop.",
    },
  ],
};

export const metadata = toolMetadata(copy);

export default function FarmPage() {
  return (
    <ToolPage copy={copy}>
      <div className="space-y-8">
        <FarmPlanner />
        <div>
          <h2 className="font-serif text-xl text-ink">Why the harvest</h2>
          <EvidenceFor caseKey="crops" />
        </div>
        <div>
          <h2 className="font-serif text-xl text-ink">Why the animals</h2>
          <EvidenceFor caseKey="livestock" />
        </div>
      </div>
    </ToolPage>
  );
}
