import AnswerList, { type AnswerItem, type Tone } from "@/components/public/AnswerList";
import type { ShareLabels } from "@/components/public/ShareButton";
import type { Messages } from "@/i18n/messages/en";

type WhoMessages = Messages["who"];
type CaseKey = keyof WhoMessages["cases"];
type Verdict = keyof WhoMessages["verdicts"];

/** Each person, and the answer most scholars give. The words are per language. */
const WHO_CASES: { key: CaseKey; verdict: Verdict }[] = [
  { key: "parents", verdict: "no" },
  { key: "children", verdict: "no" },
  { key: "wife", verdict: "no" },
  { key: "husband", verdict: "differ" },
  { key: "siblings", verdict: "ifNeed" },
  { key: "relatives", verdict: "ifNeed" },
  { key: "poor", verdict: "ifNeed" },
  { key: "debt", verdict: "yes" },
  { key: "student", verdict: "ifNeed" },
  { key: "charity", verdict: "yes" },
  { key: "mosque", verdict: "mostNo" },
  { key: "sayyid", verdict: "mostNo" },
  { key: "nonMuslim", verdict: "mostNo" },
  { key: "wealthy", verdict: "no" },
  { key: "employee", verdict: "no" },
];

const TONE: Record<Verdict, Tone> = {
  yes: "yes",
  ifNeed: "yes",
  no: "no",
  mostNo: "no",
  differ: "mixed",
};

/** "Can I give zakat to…?", person by person, in one language. */
export function whoItems(m: WhoMessages): AnswerItem[] {
  return WHO_CASES.map(({ key, verdict }) => ({
    key,
    label: m.cases[key].label,
    verdict: m.verdicts[verdict],
    tone: TONE[verdict],
    answer: m.cases[key].answer,
    icon: key,
    evidence: key,
  }));
}

/** "Can I give zakat to…?", person by person. */
export default function WhoCanReceive({
  m,
  lang,
  listen,
  stop,
  share,
  evidenceSuffix,
}: {
  m: WhoMessages;
  lang: string;
  listen: string;
  stop: string;
  share?: { label: string; labels: ShareLabels; path: string };
  evidenceSuffix?: string;
}) {
  return (
    <AnswerList
      items={whoItems(m)}
      lang={lang}
      listen={listen}
      stop={stop}
      share={share}
      evidenceSuffix={evidenceSuffix}
    />
  );
}
