import {
  IconBank,
  IconBowl,
  IconBrokenChain,
  IconCar,
  IconCollector,
  IconDome,
  IconHeart,
  IconOpenHand,
  IconTraveller,
  IconCash,
  IconChart,
  IconGoldBar,
  IconHome,
  IconOwed,
  IconPhone,
  IconReceipt,
  IconShop,
} from "@/components/icons";
import { LOCALE_INFO, type Locale } from "@/i18n/config";
import { scaleAngle } from "@/lib/scale";

/*
 * Pictures for people who would rather not read: numbers and drawings that
 * say the same in every language. Each carries its meaning in words for
 * screen readers (`label`), from the page's own text.
 */

/**
 * Zakat as one coin in forty: forty coins with one picked out, and the same
 * sum on an example amount (200,000 ÷ 40 = 5,000).
 */
export function FortyCoins({ locale, label }: { locale: Locale; label: string }) {
  const n = new Intl.NumberFormat(LOCALE_INFO[locale].intl);
  const pct = new Intl.NumberFormat(LOCALE_INFO[locale].intl, {
    style: "percent",
    maximumFractionDigits: 1,
  });
  return (
    <figure role="img" aria-label={label} className="card overflow-hidden p-5 sm:p-6">
      {/* Sums read left to right in every language, as they are written. */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-5" dir="ltr" aria-hidden>
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 40 }, (_, i) => (
            <span
              key={i}
              className={
                "block h-4 w-4 rounded-full sm:h-5 sm:w-5 " +
                (i === 39
                  ? "bg-brass ring-2 ring-brass/40 ring-offset-2 ring-offset-surface"
                  : "border border-sage/50 bg-mist/60")
              }
            />
          ))}
        </div>
        <span className="font-serif text-3xl text-sage">→</span>
        <div className="flex flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brass font-serif text-2xl text-surface">
            1
          </span>
          <span className="mt-2 font-serif text-xl text-ink nums">
            {n.format(1)} / {n.format(40)} = {pct.format(0.025)}
          </span>
        </div>
      </div>
      <p
        className="mt-6 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 font-serif text-2xl text-ink nums sm:text-3xl"
        dir="ltr"
        aria-hidden
      >
        <span>{n.format(200000)}</span>
        <span className="text-sage">÷ {n.format(40)}</span>
        <span className="text-sage">=</span>
        <span className="text-pine">{n.format(5000)}</span>
      </p>
    </figure>
  );
}

const COUNTS = [IconCash, IconBank, IconGoldBar, IconChart, IconShop, IconOwed];
const NOT_COUNTS = [IconHome, IconCar, IconPhone, IconReceipt];

/**
 * What counts and what does not, as picture tiles with a tick or a cross.
 * The words are the page's own list, in the same order as the pictures.
 */
export function CountTiles({ items, counted }: { items: readonly string[]; counted: boolean }) {
  const icons = counted ? COUNTS : NOT_COUNTS;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item, i) => {
        const Icon = icons[i] ?? (counted ? IconCash : IconHome);
        return (
          <li
            key={item}
            className={
              "relative flex flex-col items-center gap-2 border px-3 pb-4 pt-5 text-center " +
              (counted ? "border-gain/40 bg-gain/5" : "border-mist bg-paper/60")
            }
          >
            <span
              className={
                "absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold text-surface " +
                (counted ? "bg-gain" : "bg-danger")
              }
              aria-hidden
            >
              {counted ? "✓" : "✕"}
            </span>
            <Icon className={"h-10 w-10 " + (counted ? "text-pine" : "text-sage")} />
            <span className="text-sm leading-snug text-ink">{item}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** One crescent, opening to the right, centred on 0,0. */
const CRESCENT = "M0 -6 A6 6 0 1 0 0 6 A7.5 7.5 0 0 1 0 -6 Z";

/**
 * The Islamic year as twelve moons round a ring, with an arrow from your
 * zakat day all the way back to it: 354 days.
 */
export function LunarYear({ label }: { label: string }) {
  const moons = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180;
    return { x: 100 + 74 * Math.cos(a), y: 100 + 74 * Math.sin(a) };
  });
  // The arrow runs just outside the moons, from the top round to just short of it.
  const r = 90;
  const start = { x: 100 + r * Math.cos((-80 * Math.PI) / 180), y: 100 + r * Math.sin((-80 * Math.PI) / 180) };
  const end = { x: 100 + r * Math.cos((-100 * Math.PI) / 180), y: 100 + r * Math.sin((-100 * Math.PI) / 180) };
  return (
    <figure role="img" aria-label={label} className="mx-auto w-full max-w-[15rem]">
      <svg viewBox="0 0 200 200" className="h-auto w-full" aria-hidden focusable="false">
        <path
          d={`M${start.x.toFixed(1)} ${start.y.toFixed(1)} A${r} ${r} 0 1 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`}
          className="stroke-pine/50"
          fill="none"
          strokeWidth="2"
          strokeDasharray="4 5"
        />
        <path
          d={`M${end.x.toFixed(1)} ${end.y.toFixed(1)} l-7 -5 M${end.x.toFixed(1)} ${end.y.toFixed(1)} l-6 6`}
          className="stroke-pine"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {moons.map((m, i) => (
          <path
            key={i}
            d={CRESCENT}
            transform={`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)}) scale(${i === 0 ? 1.5 : 1.1})`}
            className={i === 0 ? "fill-brass" : "fill-sage/60"}
          />
        ))}
        <text x="100" y="108" textAnchor="middle" className="fill-ink font-serif" fontSize="40">
          354
        </text>
        <path d={CRESCENT} transform="translate(88 128) scale(0.9)" className="fill-sage" />
        <text x="104" y="132" textAnchor="middle" className="fill-sage font-serif" fontSize="13">
          × 12
        </text>
      </svg>
    </figure>
  );
}

/**
 * The walk-through's answer as a picture: what you have, what you owe now,
 * what is left, each as a bar against a dashed nisab line, and the zakat as
 * one coin. Bars grow from the start edge, so they follow the reading
 * direction.
 */
export function ResultPicture({
  counted,
  debts,
  net,
  nisab,
  zakat,
  due,
  money,
  labels,
  summary,
}: {
  counted: number;
  debts: number;
  net: number;
  nisab: number;
  zakat: number;
  due: boolean;
  money: (n: number) => string;
  labels: { own: string; debts: string; net: string; nisab: string; zakat: string; none: string };
  /** The same answer in words, for screen readers. */
  summary: string;
}) {
  const scale = Math.max(counted, nisab, 1) * 1.08;
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / scale) * 100)).toFixed(2)}%`;
  const rows: { label: string; value: number; bar: string; shown: string }[] = [
    { label: labels.own, value: counted, bar: "bg-sage/50", shown: money(counted) },
  ];
  if (debts > 0) rows.push({ label: labels.debts, value: debts, bar: "bg-danger/60", shown: `− ${money(debts)}` });
  rows.push({ label: labels.net, value: net, bar: due ? "bg-pine" : "bg-sage", shown: money(net) });

  return (
    <figure role="img" aria-label={summary} className="card p-4 sm:p-5">
      <BalanceScale
        className="mb-4"
        net={net}
        nisab={nisab}
        money={money}
        labels={{ you: labels.net, nisab: labels.nisab }}
      />
      <div className="relative space-y-4 pt-8" aria-hidden>
        {/* The nisab line runs down through every bar. */}
        <div
          className="absolute bottom-0 top-0 border-s-2 border-dashed border-brass"
          style={{ insetInlineStart: pct(nisab) }}
        >
          <span className="absolute -top-0.5 start-1.5 whitespace-nowrap text-xs font-medium text-brassDeep nums">
            {labels.nisab} · {money(nisab)}
          </span>
        </div>
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-sage">{row.label}</span>
              <span className="font-medium text-ink nums">{row.shown}</span>
            </div>
            <div className="mt-1 h-4 bg-mist/50">
              <div className={"h-full " + row.bar} style={{ width: pct(row.value) }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-4 border-t border-mist pt-4" aria-hidden>
        <span
          className={
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-serif text-lg " +
            (due ? "bg-brass text-surface" : "border-2 border-dashed border-sage text-sage")
          }
        >
          {due ? "1/40" : "0"}
        </span>
        <div>
          <p className="text-sm text-sage">{labels.zakat}</p>
          <p className={"font-serif text-2xl nums " + (due ? "text-pine" : "text-sage")}>
            {due ? money(zakat) : labels.none}
          </p>
        </div>
      </div>
    </figure>
  );
}

const GROUP_ICONS = [
  IconBowl,
  IconOpenHand,
  IconCollector,
  IconHeart,
  IconBrokenChain,
  IconReceipt,
  IconDome,
  IconTraveller,
];

/**
 * The eight groups who receive zakat (Quran 9:60) as numbered picture cards.
 * `label` is the same list as one sentence, for screen readers.
 */
export function EightGroups({ groups, label }: { groups: readonly string[]; label: string }) {
  return (
    <figure>
      <ol aria-label={label} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {groups.map((group, i) => {
          const Icon = GROUP_ICONS[i] ?? IconOpenHand;
          return (
            <li
              key={group}
              className="relative flex flex-col items-center gap-2 border border-pine/25 bg-pine/5 px-3 pb-4 pt-5 text-center"
            >
              <span
                className="absolute start-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-pine/40 text-xs font-medium text-pine nums"
                aria-hidden
              >
                {i + 1}
              </span>
              <Icon className="h-10 w-10 text-pine" />
              <span className="text-sm leading-snug text-ink">{group}</span>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-2 text-end text-xs text-sage nums" dir="ltr">
        (9:60)
      </figcaption>
    </figure>
  );
}


/** Where coins sit on the savings pan, bottom row first. */
const COIN_PILE: [number, number][] = [
  [0, 37],
  [-12, 37],
  [12, 37],
  [-6, 32],
  [6, 32],
  [0, 27],
];

/**
 * Mizan means "the balance": your savings on one pan, the nisab on the
 * other. The beam tips towards the heavier side and moves as figures change
 * (still, for people who ask their device for less motion). Drawn left to
 * right in every language, with the words below it.
 */
export function BalanceScale({
  net,
  nisab,
  money,
  labels,
  className = "",
  bare = false,
}: {
  net: number;
  nisab: number;
  money: (n: number) => string;
  labels: { you: string; nisab: string };
  className?: string;
  /** Only the drawing, for a small scale beside its own words. */
  bare?: boolean;
}) {
  const angle = scaleAngle(net, nisab);
  const rad = (angle * Math.PI) / 180;
  const arm = 84;
  const pivot = { x: 120, y: 30 };
  const left = { x: pivot.x - arm * Math.cos(rad), y: pivot.y - arm * Math.sin(rad) };
  const right = { x: pivot.x + arm * Math.cos(rad), y: pivot.y + arm * Math.sin(rad) };
  const above = net >= nisab && net > 0;
  // More savings, a bigger pile: one coin for a little, six at twice nisab or more.
  const coins = net > 0 ? Math.max(1, Math.min(COIN_PILE.length, Math.ceil((net / Math.max(nisab, 1)) * 3))) : 0;
  const move = "motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out";
  const pan = (fill: string) => (
    <>
      <path d="M0 0 L-24 40 M0 0 L24 40" className="stroke-sage/70" strokeWidth="1.2" fill="none" />
      <path d="M-28 40 Q0 58 28 40 Z" className={fill} />
    </>
  );
  return (
    <figure className={"mx-auto w-full max-w-xs " + className} aria-hidden dir="ltr">
      <svg viewBox="0 0 240 150" className="h-auto w-full overflow-visible" focusable="false">
        {/* Stand */}
        <path d="M120 30 V128" className="stroke-ink/70" strokeWidth="3" strokeLinecap="round" />
        <path d="M96 136 Q120 122 144 136 Z" className="fill-ink/70" />
        <circle cx="120" cy="22" r="5" className="fill-brass" />
        {/* Beam */}
        <g className={move} style={{ transform: `rotate(${angle}deg)`, transformOrigin: "120px 30px" }}>
          <path d="M36 30 H204" className="stroke-ink/80" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="120" cy="30" r="4" className="fill-ink" />
        {/* Your savings: coins */}
        <g className={move} style={{ transform: `translate(${left.x}px, ${left.y}px)` }}>
          {pan(above ? "fill-pine/80" : "fill-sage/50")}
          {COIN_PILE.slice(0, coins).map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="7" ry="3" className="fill-brass stroke-brassDeep/40" strokeWidth="0.6" />
          ))}
        </g>
        {/* Nisab: a weight of silver */}
        <g className={move} style={{ transform: `translate(${right.x}px, ${right.y}px)` }}>
          {pan("fill-sage/50")}
          <path d="M-10 39 L-7 28 H7 L10 39 Z" className="fill-sage" />
        </g>
      </svg>
      <div className={"mt-1 grid grid-cols-2 gap-3 text-center text-xs" + (bare ? " hidden" : "")}>
        <div>
          <p className="text-sage">{labels.you}</p>
          <p className={"font-medium nums " + (above ? "text-pine" : "text-ink")}>{money(net)}</p>
        </div>
        <div>
          <p className="text-sage">{labels.nisab}</p>
          <p className="font-medium text-ink nums">{money(nisab)}</p>
        </div>
      </div>
    </figure>
  );
}
