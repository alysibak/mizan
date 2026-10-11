import Link from "next/link";
import OpenFromHash from "@/components/OpenFromHash";
import ReadAloud from "@/components/ReadAloud";
import ShareButton, { type ShareLabels } from "@/components/public/ShareButton";

export type Tone = "yes" | "no" | "mixed";

export interface AnswerItem {
  key: string;
  label: string;
  /** The short answer, when there is one ("Yes", "Scholars differ"). */
  verdict?: string;
  tone?: Tone;
  answer: string;
  /** The page the answer comes from, when listed away from it. */
  page?: { href: string; label: string };
}

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
  more,
  share,
}: {
  items: AnswerItem[];
  lang: string;
  listen: string;
  stop: string;
  /** Words before the link to an answer's own page. */
  more?: string;
  /** A share button on each answer, linking to `path#key` (or the answer's own page). */
  share?: { label: string; labels: ShareLabels; path: string };
}) {
  return (
    <ul className="divide-y divide-mist border-y border-mist">
      <OpenFromHash />
      {items.map((item) => (
        <li key={item.key} id={item.key} className="scroll-mt-20">
          <details className="group">
            <summary className="flex min-h-[52px] cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 [&::-webkit-details-marker]:hidden">
              <span className="text-base font-medium text-ink">{item.label}</span>
              <span className="flex items-center gap-3">
                {item.verdict ? (
                  <span className={"border px-2 py-0.5 text-sm font-medium " + TONE[item.tone ?? "mixed"]}>
                    {item.verdict}
                  </span>
                ) : null}
                <span className="text-sage transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </span>
            </summary>
            <div className="pb-4">
              <p className="text-base leading-relaxed text-sage">{item.answer}</p>
              {item.page ? (
                <p className="mt-2 text-sm text-sage">
                  {more}{" "}
                  <Link href={item.page.href} className="font-medium text-pine hover:underline">
                    {item.page.label}
                  </Link>
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <ReadAloud
                  text={[item.label, item.verdict, item.answer].filter(Boolean).join(". ")}
                  lang={lang}
                  listen={listen}
                  stop={stop}
                />
                {share ? (
                  <ShareButton
                    label={share.label}
                    text={`${item.label}${/[?؟]$/.test(item.label) ? "" : ":"} ${item.answer}`}
                    path={item.page?.href ?? `${share.path}#${item.key}`}
                    labels={share.labels}
                  />
                ) : null}
              </div>
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
