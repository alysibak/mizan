import Link from "next/link";
import { reckoningStep, type ReckoningStepId } from "@/lib/reckoning-path";

/** Where you are in closing the year, with the way back and forward. */
export default function ReckoningStepNav({
  current,
}: {
  current: ReckoningStepId;
}) {
  const { step, prev, next, index, total } = reckoningStep(current);

  return (
    <nav
      className="border border-mist bg-paper px-4 py-3"
      aria-label="Close the year, step by step"
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/tools/reckoning-night"
          className="label text-brassDeep hover:text-pine"
        >
          Close the year
        </Link>
        <p className="text-xs text-sage nums">
          Step {index + 1} of {total}
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
            ← All steps
          </Link>
        )}
        {next ? (
          <Link href={next.href} className="btn-primary text-sm">
            Next: {step.nextLabel ?? next.title} →
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
