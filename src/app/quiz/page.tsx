import QuizGame, { type QuizRound } from "@/components/public/QuizGame";
import ToolPage, { toolMetadata, type ToolPageCopy } from "@/components/public/ToolPage";
import { appliesItems } from "@/components/public/AppliesView";
import { whoItems } from "@/components/public/WhoCanReceive";
import { messagesFor } from "@/i18n/messages";

const copy: ToolPageCopy = {
  path: "/quiz",
  metaTitle: "Zakat quiz: learn the basics in two minutes",
  metaDescription:
    "Ten picture questions: do you pay zakat on your house, your gold, your Hajj savings? Can your zakat go to your parents, your brother, someone in debt? Tap yes or no and see why.",
  appName: "Mizan zakat quiz",
  eyebrow: "Learn by playing",
  title: "Zakat in ten questions",
  lede: "Look at the picture, tap Yes or No, and see at once why. It takes two minutes.",
  sections: [
    {
      heading: "Where the answers come from",
      body: (
        <p>
          Every answer is the one on “Do I pay zakat on…?” and “Can I give zakat to…?”, with the Quran and hadith
          behind it a tap away there. Where scholars differ, the quiz asks only what most of them agree on.
        </p>
      ),
    },
  ],
  faq: [
    {
      q: "Is my score saved?",
      a: "No. Nothing is stored or sent. Play as often as you like.",
    },
  ],
};

export const metadata = toolMetadata(copy);

/** Questions with a clear yes or no, mixing the two pages. */
const ROUNDS: { from: "applies" | "who"; key: string }[] = [
  { from: "applies", key: "home" },
  { from: "applies", key: "goals" },
  { from: "who", key: "parents" },
  { from: "applies", key: "car" },
  { from: "applies", key: "bullion" },
  { from: "who", key: "siblings" },
  { from: "applies", key: "business" },
  { from: "who", key: "wealthy" },
  { from: "applies", key: "gems" },
  { from: "who", key: "debt" },
];

export default function QuizPage() {
  const en = messagesFor("en");
  const applies = appliesItems(en.applies);
  const who = whoItems(en.who);
  const rounds: QuizRound[] = ROUNDS.map(({ from, key }) => {
    const item = (from === "applies" ? applies : who).find((i) => i.key === key)!;
    return {
      key,
      prompt: from === "applies" ? "Do I pay zakat on" : "Can I give zakat to",
      label: item.label,
      yes: item.tone === "yes",
      verdict: item.verdict ?? "",
      answer: item.answer,
      href: `${from === "applies" ? "/what-counts" : "/who-can-receive"}#${key}`,
    };
  });
  return (
    <ToolPage copy={copy}>
      <QuizGame rounds={rounds} />
    </ToolPage>
  );
}
