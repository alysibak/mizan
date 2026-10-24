import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareButton from "@/components/public/ShareButton";
import { ExampleBanner, NeedBar, NeedIcon, ZakatBadge, progressWords, stateWords } from "@/components/neighbours/NeedBits";
import PledgeBox from "@/components/neighbours/PledgeBox";
import ReportNeed from "@/components/neighbours/ReportNeed";
import ReadAloud from "@/components/ReadAloud";
import { kindLabel } from "@/lib/neighbours";
import { ensureExample, neighboursMode, publicNeed } from "@/lib/neighbours-store";
import { formatMoney } from "@/lib/money";
import { messagesFor } from "@/i18n/messages";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = neighboursMode() === "off" ? null : await publicNeed((await params).id);
  if (!found) return { title: "Not found" };
  return {
    title: found.need.title,
    description: `Checked by ${found.partner.name}, ${found.partner.city}. ${progressWords(found.progress, found.need.amount, found.partner.currency)}`,
    robots: neighboursMode() === "on" ? undefined : { index: false, follow: false },
  };
}

/** One need: what it is, who checked it, how far it has got, and "I'll give this". */
export default async function NeedPage({ params }: Props) {
  const mode = neighboursMode();
  if (mode === "off") notFound();
  await ensureExample();
  const found = await publicNeed((await params).id);
  if (!found) notFound();
  const { need, partner, progress, state, daysLeft } = found;
  const money = (n: number) => formatMoney(n, partner.currency);
  const words = stateWords(state, daysLeft);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-5 pb-16 pt-6 md:px-10">
        {mode === "demo" ? <ExampleBanner /> : null}
        <Link href="/neighbours" className="inline-flex min-h-[44px] items-center text-base text-pine hover:underline">
          ← All needs
        </Link>

        <header className="flex items-start gap-4">
          <NeedIcon kind={need.kind} size="lg" />
          <div>
            <p className="text-sm text-sage">{kindLabel(need.kind)}</p>
            <h1 className="font-serif text-3xl leading-tight text-ink">{need.title}</h1>
            <p className="mt-2 text-base text-sage">
              Checked in person by{" "}
              <Link href={`/neighbours/at/${partner.slug}`} className="text-pine underline underline-offset-2">
                {partner.name}
              </Link>
              , {partner.city}
            </p>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <ZakatBadge zakat={need.zakat} />
          <ReadAloud
            text={[
              need.title,
              `Checked in person by ${partner.name}, ${partner.city}.`,
              need.zakat ? "Zakat can go here." : "Charity only, not zakat.",
              need.story,
              progressWords(progress, need.amount, partner.currency),
            ]
              .filter(Boolean)
              .join(" ")}
            lang="en"
            listen={messagesFor("en").common.listen}
            stop={messagesFor("en").common.stopListening}
          />
        </div>

        {need.story ? <p className="whitespace-pre-line text-lg leading-relaxed text-ink">{need.story}</p> : null}

        <section aria-label="How far it has got" className="space-y-2">
          <NeedBar progress={progress} label={progressWords(progress, need.amount, partner.currency)} />
          <p className="text-base text-ink nums">
            <strong className="font-semibold">{money(progress.received)}</strong> of {money(need.amount)} has arrived
            {progress.pledged > 0 ? <span className="text-sage"> · {money(progress.pledged)} more promised</span> : null}
          </p>
          {words ? <p className="text-base text-sage">{words}</p> : null}
          {need.thanks && state === "met" ? (
            <blockquote className="border-s-4 border-brass bg-brass/5 px-4 py-3 text-base text-ink">
              {need.thanks}
              <footer className="mt-1 text-sm text-sage">{partner.name}</footer>
            </blockquote>
          ) : null}
        </section>

        {state === "open" ? (
          <PledgeBox
            needId={need.id}
            title={need.title}
            partner={partner.name}
            currency={partner.currency}
            room={progress.room}
            zakat={need.zakat}
            easy={messagesFor("en").common.easy}
          />
        ) : null}

        <div className="border-t border-mist pt-4">
          <ShareButton
            label="Share this need"
            text={`${need.title}. Checked by ${partner.name}.`}
            path={`/neighbours/${need.id}`}
            labels={messagesFor("en").common.share}
          />
        </div>

        <ReportNeed needId={need.id} />
      </main>
      <SiteFooter />
    </div>
  );
}
