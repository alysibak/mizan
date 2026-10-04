import Link from "next/link";
import { reckoningStep, type ReckoningStepId } from "@/lib/reckoning-path";

/** Sticky path chrome so sitting tools feel like one flow. */
export default function ReckoningStepNav({
  current,
}: {
  current: ReckoningStepId;
}) {
  const { step, prev, next, index, total } = reckoningStep(current);

  return (
    <nav
      className="border border-mist bg-paper px-4 py-3"
      aria-label="Reckoning night steps"
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/tools/reckoning-night"
          className="label text-brassDeep hover:text-pine"
        >
          Reckoning night
        </Link>
        <p className="text-xs text-sage nums">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
      </div>
      <p className="mt-1 font-serif text-lg text-ink">{step.title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {prev ? (
          <Link href={prev.href} className="btn-ghost text-sm">
            ← {prev.title}
          </Link>
        ) : (
          <Link href="/tools/reckoning-night" className="btn-ghost text-sm">
            ← Overview
          </Link>
        )}
        {next ? (
          <Link href={next.href} className="btn-primary text-sm">
            {step.nextLabel ?? next.title} →
          </Link>
        ) : (
          <>
            <Link href="/giving?type=zakat" className="btn-primary text-sm">
              Record zakat →
            </Link>
            <Link href="/year#freeze-year" className="btn-ghost text-sm">
              Freeze → roll → statement
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
