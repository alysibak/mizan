import ReadAloud from "@/components/ReadAloud";

export type Tone = "yes" | "no" | "mixed";

const TONE: Record<Tone, string> = {
  yes: "border-gain/50 text-gain",
  no: "border-danger/40 text-danger",
  mixed: "border-brass/60 text-brassDeep",
};

/**
 * Questions with the short answer in view and the reason a tap away. Works
 * without scripts, and reads aloud where the device has a voice for the language.
 */
export default function AnswerList({
  items,
  lang,
  listen,
  stop,
}: {
  items: { key: string; label: string; verdict: string; tone: Tone; answer: string }[];
  lang: string;
  listen: string;
  stop: string;
}) {
  return (
    <ul className="divide-y divide-mist border-y border-mist">
      {items.map((item) => (
        <li key={item.key}>
          <details className="group">
            <summary className="flex min-h-[52px] cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 [&::-webkit-details-marker]:hidden">
              <span className="text-base font-medium text-ink">{item.label}</span>
              <span className="flex items-center gap-3">
                <span className={"border px-2 py-0.5 text-sm font-medium " + TONE[item.tone]}>
                  {item.verdict}
                </span>
                <span className="text-sage transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </span>
            </summary>
            <div className="pb-4">
              <p className="text-base leading-relaxed text-sage">{item.answer}</p>
              <ReadAloud
                className="mt-3"
                text={`${item.label}. ${item.verdict}. ${item.answer}`}
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
