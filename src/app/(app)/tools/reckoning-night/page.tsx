import Link from "next/link";
import { RECKONING_STEPS } from "@/lib/reckoning-path";

export default function ReckoningNightPage() {
  return (
    <div className="space-y-10">
      <header>
        <p className="label text-brass">A sitting</p>
        <h1 className="mt-1 font-serif text-4xl text-ink">Reckoning night</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-sage">
          One path for the evening you close the year. Remember, watch nisab,
          sketch envelopes, then pay → freeze → roll hawl → statement.
        </p>
      </header>

      <ol className="space-y-0 divide-y divide-mist border-y border-mist">
        {RECKONING_STEPS.map((s) => (
          <li key={s.id}>
            <Link
              href={s.href}
              className="block py-8 transition hover:bg-mist/20"
            >
              <p className="text-xs tracking-[0.2em] text-brass">
                {String(s.n).padStart(2, "0")}
              </p>
              <p className="mt-2 font-serif text-2xl text-ink">{s.title}</p>
              <p className="mt-2 text-sm text-pine">
                {s.nextLabel ? `Continue → ${s.nextLabel}` : "Then roll hawl & statement"}
              </p>
            </Link>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link href={RECKONING_STEPS[0]!.href} className="btn-primary">
          Begin step 1
        </Link>
        <Link href="/dashboard" className="btn-ghost">
          Back to Balance
        </Link>
      </div>
    </div>
  );
}
