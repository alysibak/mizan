import { redirect } from "next/navigation";
import { and, count, desc, eq, gte, sum } from "drizzle-orm";
import { db } from "@/db";
import { feedback, journeyCounts, problemReports } from "@/db/schema";
import ProblemDone from "@/components/ProblemDone";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { JOURNEY_LABELS, JOURNEY_STEPS, countDay } from "@/lib/feedback";
import { LOCALE_INFO, type Locale } from "@/i18n/config";
import AdminTabs from "../AdminTabs";

const PLACES: Record<string, string> = { guide: "Guide answer", account: "Account Home", neighbours: "After a promise" };
const PROBLEM_LABELS: Record<string, string> = {
  wrong: "An answer looks wrong",
  broken: "Something does not work",
  hard: "Hard to understand",
  other: "Something else",
  crash: "The page broke (sent by the page itself)",
};

function when(iso: string): string {
  // SQLite CURRENT_TIMESTAMP has no zone marker but is UTC.
  const d = new Date(`${iso.replace(" ", "T")}Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
}

/** A time as SQLite's CURRENT_TIMESTAMP writes it, so the two compare. */
function stampDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().replace("T", " ").slice(0, 19);
}

async function journeySince(days: number) {
  const from = countDay(new Date(Date.now() - (days - 1) * 86_400_000));
  const rows = await db
    .select({ step: journeyCounts.step, n: sum(journeyCounts.count) })
    .from(journeyCounts)
    .where(gte(journeyCounts.day, from))
    .groupBy(journeyCounts.step);
  const by = new Map(rows.map((r) => [r.step, Number(r.n ?? 0)]));
  return JOURNEY_STEPS.map((step) => ({ step, n: by.get(step) ?? 0 }));
}

/**
 * For testing with real people: how far they got, and what they said when
 * asked "Was this easy?". Nothing here is tied to anyone.
 */
export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me)) redirect("/dashboard");

  const days = (await searchParams).days === "30" ? 30 : 7;
  const since = stampDaysAgo(days);
  const [steps, [yes], [no], notes, problems] = await Promise.all([
    journeySince(days),
    db.select({ n: count() }).from(feedback).where(and(eq(feedback.easy, true), gte(feedback.createdAt, since))),
    db.select({ n: count() }).from(feedback).where(and(eq(feedback.easy, false), gte(feedback.createdAt, since))),
    db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(100),
    db.select().from(problemReports).orderBy(desc(problemReports.createdAt)).limit(100),
  ]);
  const openProblems = problems.filter((p) => p.status === "open").length;
  const top = Math.max(1, ...steps.map((s) => s.n));
  const asked = (yes?.n ?? 0) + (no?.n ?? 0);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="font-serif text-3xl text-ink">What people said</h1>
        <AdminTabs current="/admin/feedback" />
      </header>

      <section aria-labelledby="journey" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="journey" className="font-serif text-xl text-ink">
            How far people got
          </h2>
          <p className="text-sm text-sage">
            {days === 7 ? (
              <>
                Last 7 days ·{" "}
                <a href="?days=30" className="text-pine hover:underline">
                  30 days
                </a>
              </>
            ) : (
              <>
                <a href="?days=7" className="text-pine hover:underline">
                  7 days
                </a>{" "}
                · Last 30 days
              </>
            )}
          </p>
        </div>
        <ol className="space-y-2.5">
          {steps.map(({ step, n }) => (
            <li key={step} data-step={step}>
              <div className="flex items-baseline justify-between gap-3 text-base">
                <span className="text-ink">{JOURNEY_LABELS[step]}</span>
                <span className="font-medium text-ink nums">{n.toLocaleString("en")}</span>
              </div>
              <div className="mt-1 h-3 bg-mist/50" aria-hidden>
                <div className="h-full bg-pine" style={{ width: `${(n / top) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
        <p className="text-sm text-sage">
          Counted once per step per browser tab. Only the step and the day are kept.
        </p>
      </section>

      <section aria-labelledby="problems" className="space-y-3">
        <h2 id="problems" className="font-serif text-xl text-ink">
          Problems reported{openProblems ? ` (${openProblems} open)` : ""}
        </h2>
        <ul className="divide-y divide-mist border-y border-mist">
          {problems.map((p) => (
            <li key={p.id} className={"py-3 " + (p.status === "done" ? "opacity-60" : "")}>
              <p className="text-sm text-sage">
                <span className="font-medium text-ink">{PROBLEM_LABELS[p.kind] ?? p.kind}</span>
                {p.page ? <> · <span className="font-mono">{p.page}</span></> : null} ·{" "}
                {LOCALE_INFO[p.locale as Locale]?.name ?? p.locale} · {when(p.createdAt)}
                {p.status === "done" ? " · done" : ""}
              </p>
              <p dir="auto" className="mt-1 whitespace-pre-line text-base text-ink">
                {p.note}
              </p>
              {p.contact ? (
                <p dir="auto" className="mt-1 text-sm text-sage">
                  Reply to: {p.contact}
                </p>
              ) : null}
              <ProblemDone id={p.id} done={p.status === "done"} />
            </li>
          ))}
          {problems.length === 0 ? <li className="py-6 text-center text-sage">Nothing reported.</li> : null}
        </ul>
      </section>

      <section aria-labelledby="easy" className="space-y-3">
        <h2 id="easy" className="font-serif text-xl text-ink">
          Was it easy?
        </h2>
        <p className="text-base text-ink">
          {asked === 0
            ? `Nobody has answered in the last ${days} days.`
            : `${yes?.n ?? 0} said yes, ${no?.n ?? 0} said not really, in the last ${days} days.`}
        </p>
        <ul className="divide-y divide-mist border-y border-mist">
          {notes.map((f) => (
            <li key={f.id} className="py-3">
              <p className="text-sm text-sage">
                <span className={f.easy ? "font-medium text-pine" : "font-medium text-brassDeep"}>
                  {f.easy ? "Easy" : "Not really"}
                </span>{" "}
                · {PLACES[f.page] ?? f.page} · {LOCALE_INFO[f.locale as Locale]?.name ?? f.locale} ·{" "}
                {when(f.createdAt)}
              </p>
              {f.note ? <p dir="auto" className="mt-1 whitespace-pre-line text-base text-ink">
                  {f.note}
                </p> : null}
            </li>
          ))}
          {notes.length === 0 ? <li className="py-6 text-center text-sage">Nothing yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
