import ReadAloud from "@/components/ReadAloud";
import type { Messages } from "@/i18n/messages/en";

type WhoMessages = Messages["who"];
type CaseKey = keyof WhoMessages["cases"];
type Verdict = keyof WhoMessages["verdicts"];

/** Each person, and the answer most scholars give. The words are per language. */
export const WHO_CASES: { key: CaseKey; verdict: Verdict }[] = [
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

const TONE: Record<Verdict, string> = {
  yes: "border-gain/50 text-gain",
  ifNeed: "border-gain/50 text-gain",
  no: "border-danger/40 text-danger",
  mostNo: "border-danger/40 text-danger",
  differ: "border-brass/60 text-brassDeep",
};

/**
 * "Can I give zakat to…?": each person with the short answer in view, and
 * the reason a tap away. Works without scripts, and reads aloud where the
 * device has a voice for the language.
 */
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
    <ul className="divide-y divide-mist border-y border-mist">
      {WHO_CASES.map(({ key, verdict }) => (
        <li key={key}>
          <details className="group">
            <summary className="flex min-h-[52px] cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 [&::-webkit-details-marker]:hidden">
              <span className="text-base font-medium text-ink">{m.cases[key].label}</span>
              <span className="flex items-center gap-3">
                <span className={"border px-2 py-0.5 text-sm font-medium " + TONE[verdict]}>
                  {m.verdicts[verdict]}
                </span>
                <span className="text-sage transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </span>
            </summary>
            <div className="pb-4">
              <p className="text-base leading-relaxed text-sage">{m.cases[key].answer}</p>
              <ReadAloud
                className="mt-3"
                text={`${m.cases[key].label}. ${m.verdicts[verdict]}. ${m.cases[key].answer}`}
                lang={lang}
                listen={listen}
                stop={stop}
              />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
