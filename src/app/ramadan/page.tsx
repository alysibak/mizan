import Link from "next/link";
import RamadanCountdown from "@/components/public/RamadanCountdown";
import TenNightsPlanner from "@/components/public/TenNightsPlanner";
import EvidenceFor from "@/components/public/Evidence";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";
import { IconBowl, IconCoins, IconYear } from "@/components/icons";
import { messagesFor } from "@/i18n/messages";

const copy: ToolPageCopy = {
  path: "/ramadan",
  metaTitle: "Ramadan giving: zakat, fitrana, and a last-ten-nights plan",
  metaDescription:
    "Everything you give in Ramadan in one place: work out your zakat, your household's Zakat al-Fitr, and spread a gift over the last ten nights with a reminder each evening. Free, no sign-up.",
  appName: "Mizan Ramadan giving planner",
  eyebrow: "Ramadan",
  title: "Your Ramadan giving, in one place",
  lede: "Three things, in the order they come: your zakat, a gift spread over the last ten nights, and Zakat al-Fitr before the Eid prayer.",
  sections: [
    {
      heading: "Before or early in Ramadan: your zakat",
      body: (
        <p>
          Many people keep Ramadan as their zakat day, so they work it out once a year at the same time.{" "}
          <Link href="/guide" className="text-pine hover:underline">
            Work it out step by step
          </Link>
          . Zakat that is already due should not be held back to wait for Ramadan or the last ten nights.
        </p>
      ),
    },
    {
      heading: "The last ten nights",
      body: (
        <p>
          Laylat al-Qadr, the Night of Decree, is better than a thousand months, and it is sought in the odd
          nights of the last ten. No one knows which night it is, so many people give something every night to be
          sure they give on it.
        </p>
      ),
    },
    {
      heading: "Before the Eid prayer: Zakat al-Fitr",
      body: (
        <p>
          A set amount for each person in your household, so the poor can celebrate too.{" "}
          <Link href="/zakat-al-fitr" className="text-pine hover:underline">
            Work out your household&rsquo;s fitrana
          </Link>
          .
        </p>
      ),
    },
    {
      heading: "A plan, not a payment",
      body: (
        <p>
          Mizan never takes or passes on money. It makes the plan and the reminders; you give through your mosque,
          a charity you trust, or directly to people in need. Many charities also let you schedule a gift for each
          of the last ten nights.
        </p>
      ),
    },
  ],
  next: [
    { href: "/guide", label: "Work out my zakat", icon: "guide" },
    { href: "/zakat-al-fitr", label: "Zakat al-Fitr for my family", icon: "fitr" },
    { href: "/fasts", label: "Fasts I missed last year", icon: "fasts" },
  ],
  faq: [
    {
      q: "Which night is Laylat al-Qadr?",
      a: "No one knows for certain. The Prophet ﷺ told us to seek it in the odd nights of the last ten, and many hope for the 27th. Giving every night makes sure you give on it.",
    },
    {
      q: "Can my zakat be part of the plan?",
      a: "If your zakat falls due during Ramadan, you can give it over these nights, as long as it reaches people who may receive zakat. Do not hold back zakat that is already due to wait for them. Many people keep zakat and voluntary charity apart so they know which is which.",
    },
    {
      q: "Does Mizan take the money?",
      a: "No. Mizan only makes the plan and the calendar reminders, in your browser. Nothing you type is stored or sent.",
    },
    {
      q: "What if Ramadan has 29 days?",
      a: "Then there are nine nights from the 21st. The plan follows the Umm al-Qura calendar; if your local moon sighting moves Ramadan by a day, the nights move with it.",
    },
  ],
};

export const metadata = toolMetadata(copy);

const STEPS = [
  { href: "/guide", label: "Work out my zakat", Icon: IconCoins },
  { href: "#nights-title", label: "Plan the last ten nights", Icon: IconYear },
  { href: "/zakat-al-fitr", label: "Zakat al-Fitr for my family", Icon: IconBowl },
];

export default function RamadanPage() {
  const en = messagesFor("en");
  return (
    <ToolPage copy={copy}>
      <div className="space-y-8">
        <RamadanCountdown m={en.ramadan} locale="en" planLink={false} />
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map(({ href, label, Icon }, i) => (
            <li key={href}>
              <Link
                href={href}
                className="card flex min-h-[72px] items-center gap-3 px-4 py-3 transition hover:border-pine"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pine/30 bg-pine/5 text-pine"
                  aria-hidden
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-xs text-sage nums">{i + 1}</span>
                  <span className="block text-sm font-medium text-ink">{label}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <TenNightsPlanner />
        <EvidenceFor caseKey="ramadan" />
      </div>
    </ToolPage>
  );
}
