import Link from "next/link";
import { RECKONING_STEPS } from "@/lib/reckoning-path";

export default function ReckoningNightPage() {
  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow">When your zakat day comes</p>
        <h1 className="mt-1 font-serif text-4xl text-ink">Close the year</h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-sage">
          Three short steps. Check for anything you forgot, give your zakat,
          then close the year: Mizan keeps a copy and starts counting the next.
        </p>
      </header>

      <ol className="space-y-0 divide-y divide-mist border-y border-mist">
        {RECKONING_STEPS.map((s) => (
          <li key={s.id}>
            <Link
              href={s.href}
              className="block py-8 transition hover:bg-mist/20"
            >
              <p className="text-xs tracking-[0.2em] text-brassDeep">
                Step {s.n}
              </p>
              <p className="mt-2 font-serif text-2xl text-ink">{s.title}</p>
            </Link>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link href={RECKONING_STEPS[0]!.href} className="btn-primary">
          Start step 1
        </Link>
        <Link href="/dashboard" className="btn-ghost">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
