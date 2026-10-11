import AnswerList, { type Tone } from "@/components/public/AnswerList";
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

/** "Can I give zakat to…?", person by person. */
export default function WhoCanReceive({
  m,
  lang,
  listen,
  stop,
}: {
  m: WhoMessages;
  lang: string;
  listen: string;
  stop: string;
}) {
  return (
    <AnswerList
      items={WHO_CASES.map(({ key, verdict }) => ({
        key,
        label: m.cases[key].label,
        verdict: m.verdicts[verdict],
        tone: TONE[verdict],
        answer: m.cases[key].answer,
      }))}
      lang={lang}
      listen={listen}
      stop={stop}
    />
  );
}
