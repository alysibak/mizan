import {
  EVIDENCE,
  STRENGTH,
  TIER_LABEL,
  type Evidence as EvidenceItem,
  type Tier,
} from "@/content/evidence";

const TIER_CLASS: Record<Tier, string> = {
  strong: "border-pine bg-pine text-surface",
  sound: "border-pine/60 text-pine",
  maybe: "border-dashed border-brass text-brassDeep",
};

/** "Strong", "Sound", or "Maybe", as a small coloured tag. */
export function TierTag({ tier, count }: { tier: Tier; count?: number }) {
  return (
    <span
      className={
        "inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-xs font-medium " + TIER_CLASS[tier]
      }
    >
      {TIER_LABEL[tier]}
      {count && count > 1 ? <span className="nums">×{count}</span> : null}
    </span>
  );
}

function Item({ e }: { e: EvidenceItem }) {
  const { label, tier } = STRENGTH[e.strength];
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 w-[4.5rem] shrink-0">
        <TierTag tier={tier} />
      </span>
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-ink">{e.text}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-sage">
          {/* The Quran and the two Sahihs name themselves in the reference. */}
          {e.strength === "quran" || e.strength === "agreed" ? e.ref : `${label} · ${e.ref}`}
        </p>
      </div>
    </li>
  );
}

/** Every piece of evidence for an answer, in its own views too. */
function allOf(key: string): EvidenceItem[] {
  const data = EVIDENCE[key];
  if (!data) return [];
  return [...data.evidence, ...(data.views ?? []).flatMap((v) => v.evidence)];
}

/**
 * The evidence behind one answer, folded: the summary shows only how strong
 * it is (Strong ×2 · Maybe ×1), and a tap opens each proof with its source,
 * and each scholarly view with its own. `suffix` marks it as English on
 * pages in other languages.
 */
export default function EvidenceFor({ caseKey, suffix = "" }: { caseKey: string; suffix?: string }) {
  const data = EVIDENCE[caseKey];
  if (!data) return null;
  const counts = new Map<Tier, number>();
  for (const e of new Set(allOf(caseKey))) {
    const tier = STRENGTH[e.strength].tier;
    counts.set(tier, (counts.get(tier) ?? 0) + 1);
  }
  const tiers = (["strong", "sound", "maybe"] as const).filter((t) => counts.has(t));
  return (
    <details className="group/ev mt-4 border border-mist bg-paper/60">
      <summary className="flex min-h-[44px] cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-medium text-pine">
          Evidence{suffix}
        </span>
        {tiers.map((t) => (
          <TierTag key={t} tier={t} count={counts.get(t)} />
        ))}
        {data.views?.length ? (
          <span className="text-xs text-sage nums">· {data.views.length} views</span>
        ) : null}
        <span className="ms-auto text-sage transition group-open/ev:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="space-y-4 border-t border-mist px-3 pb-4 pt-3">
        {data.evidence.length ? (
          <ul className="space-y-3">
            {data.evidence.map((e) => (
              <Item key={e.text} e={e} />
            ))}
          </ul>
        ) : null}
        {data.views?.length ? (
          <div>
            <p className="text-sm font-medium text-brassDeep">Where scholars differ{suffix}</p>
            <ol className="mt-2 space-y-3">
              {data.views.map((v) => (
                <li key={v.who} className="border-s-2 border-brass/60 ps-3">
                  <p className="text-sm font-medium text-ink">{v.who}</p>
                  <p className="text-sm leading-relaxed text-sage">{v.says}</p>
                  {v.evidence.length ? (
                    <ul className="mt-2 space-y-2">
                      {v.evidence.map((e) => (
                        <Item key={e.text} e={e} />
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </details>
  );
}

/** What the three tags mean, once per page. */
export function EvidenceKey({ suffix = "" }: { suffix?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-relaxed text-sage">
      <span className="font-medium text-ink">How strong the evidence is{suffix}:</span>
      <span className="flex items-center gap-1.5">
        <TierTag tier="strong" /> Quran, Bukhari and Muslim, or all scholars agree
      </span>
      <span className="flex items-center gap-1.5">
        <TierTag tier="sound" /> other sound hadith, the Companions
      </span>
      <span className="flex items-center gap-1.5">
        <TierTag tier="maybe" /> weak or disputed hadith, scholars’ reasoning
      </span>
    </div>
  );
}
