import Link from "next/link";
import type { ComponentType } from "react";
import {
  IconBook,
  IconBowl,
  IconBrokenChain,
  IconHeart,
  IconHome,
  IconOpenHand,
  IconReceipt,
  IconTraveller,
} from "@/components/icons";
import { formatMoney } from "@/lib/money";
import type { NeedProgress, NeedState } from "@/lib/neighbours";
import type { NeedView } from "@/lib/neighbours-store";

const KIND_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  rent: IconHome,
  food: IconBowl,
  medical: IconHeart,
  bills: IconReceipt,
  debt: IconBrokenChain,
  school: IconBook,
  travel: IconTraveller,
  other: IconOpenHand,
};

/** The need's kind as a picture in a circle. */
export function NeedIcon({ kind, size = "md" }: { kind: string; size?: "md" | "lg" }) {
  const Icon = KIND_ICONS[kind] ?? IconOpenHand;
  return (
    <span
      aria-hidden
      className={
        "flex shrink-0 items-center justify-center rounded-full bg-pine/10 text-pine " +
        (size === "lg" ? "h-16 w-16" : "h-12 w-12")
      }
    >
      <Icon className={size === "lg" ? "h-8 w-8" : "h-6 w-6"} />
    </span>
  );
}

/** Zakat may go here, or general charity only: the partner's scholar decided. */
export function ZakatBadge({ zakat }: { zakat: boolean }) {
  return zakat ? (
    <span className="inline-flex items-center border border-brass/50 bg-brass/10 px-2 py-0.5 text-sm font-medium text-brassDeep">
      Zakat can go here
    </span>
  ) : (
    <span className="inline-flex items-center border border-mist bg-paper px-2 py-0.5 text-sm font-medium text-sage">
      Charity only, not zakat
    </span>
  );
}

/** What arrived, solid; what is promised, lighter; the rest, empty. */
export function NeedBar({ progress, label }: { progress: NeedProgress; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="relative h-3 overflow-hidden bg-mist/60"
    >
      <div className="absolute inset-y-0 start-0 bg-pine/35" style={{ width: `${progress.promisedShare * 100}%` }} />
      <div className="absolute inset-y-0 start-0 bg-pine" style={{ width: `${progress.share * 100}%` }} />
    </div>
  );
}

export function progressWords(progress: NeedProgress, amount: number, currency: string): string {
  const money = (n: number) => formatMoney(n, currency);
  const parts = [`${money(progress.received)} of ${money(amount)} has arrived`];
  if (progress.pledged > 0) parts.push(`${money(progress.pledged)} more is promised`);
  return parts.join(", ") + ".";
}

export function stateWords(state: NeedState, daysLeft: number | null): string | null {
  switch (state) {
    case "covered":
      return "Fully promised. The money is on its way.";
    case "met":
      return "Met. Thank you to everyone who gave.";
    case "ended":
      return "Its time ran out.";
    case "closed":
      return "Closed.";
    case "paused":
      return "Off the list while the mosque checks it.";
    case "open":
      return daysLeft === null ? null : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;
    default:
      return null;
  }
}

/** One need in a list: picture, what it is, who checked it, how far it has got. */
export function NeedCard({ view }: { view: NeedView }) {
  const { need, partner, progress, state, daysLeft } = view;
  const words = stateWords(state, daysLeft);
  return (
    <li>
      <Link
        href={`/neighbours/${need.id}`}
        className="flex h-full flex-col gap-3 border-2 border-mist bg-surface p-4 transition hover:border-pine"
      >
        <div className="flex items-start gap-3">
          <NeedIcon kind={need.kind} />
          <div className="min-w-0">
            <p className="font-serif text-lg leading-snug text-ink">{need.title}</p>
            <p className="mt-1 text-sm text-sage">
              Checked by {partner.name} · {partner.city}
            </p>
          </div>
        </div>
        <NeedBar progress={progress} label={progressWords(progress, need.amount, partner.currency)} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium text-ink nums">
            {formatMoney(progress.received, partner.currency)} of {formatMoney(need.amount, partner.currency)}
          </span>
          {words ? <span className="text-sage">{words}</span> : null}
        </div>
        <div>
          <ZakatBadge zakat={need.zakat} />
        </div>
      </Link>
    </li>
  );
}

/** Shown on every page of the example: nothing here is real. */
export function ExampleBanner() {
  return (
    <p role="note" className="border border-brass/50 bg-brass/10 px-4 py-3 text-base text-ink">
      <strong className="font-semibold">An example.</strong> The mosque and every need here are made up, to show how
      Mizan Neighbours works. Nothing here is real, and no money should be sent.
    </p>
  );
}
